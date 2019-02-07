import {Subject} from 'rxjs';
import {AnimateReorder} from './animate-reorder';
import {current} from 'codelyzer/util/syntaxKind';

export class DragNDropItem {
    private _wrapperClone: HTMLElement;
    private _elementClone: HTMLElement;
    private readonly _element: HTMLElement;
    private _shiftX: number;
    private _shiftY: number;
    private _potentialIndex: number = null;
    private _holdingOverTimer: any;
    private _dropableBelow: HTMLElement;

    set currentIndex(index: number) {
        this._currentIndex = index;
        if (this._elementWrapper) {
            this._elementWrapper.setAttribute('data-index', '' + index);
        }
    }

    get currentIndex(): number {
        return this._currentIndex;
    }

    protected indexChangeSource = new Subject<{ from: number, to: number }>();
    emitIndexChange$ = this.indexChangeSource.asObservable();

    private static removeDraggableAnimations(element: HTMLElement) {
        element.classList.remove('drag-n-drop--draggable');
    }

    private static addDraggableAnimations(element: HTMLElement) {
        element.classList.add('drag-n-drop--draggable');
    }

    constructor(private _elementWrapper: HTMLElement,
                private _currentIndex: number) {
        this.currentIndex = _currentIndex;
        this._element = <HTMLElement>this._elementWrapper.firstElementChild;

        // Create element id
        this._elementWrapper.setAttribute('data-local-id', _currentIndex + '');
    }

    get elementWrapper(): HTMLElement {
        return this._elementWrapper;
    }

    get element(): HTMLElement {
        return this._element;
    }

    get localId(): number {
        return +this._elementWrapper.getAttribute('data-local-id');
    }

    enable() {
        DragNDropItem.addDraggableAnimations(this._element);
        this._element.style.cursor = 'move';
        this.addEvents();
    }

    disable() {
        DragNDropItem.removeDraggableAnimations(this._element);
        this._element.style.cursor = null;
        this.removeEvents();
    }

    private addEvents() {
        this._element.onmousedown = event => this.onMouseDown(event);
        this._element.ondragstart = () => false;
        this._elementWrapper.ondragstart = () => false;
        this._elementWrapper.style.touchAction = 'none';

        this.killDragStartOnImages();
    }

    private removeEvents() {
        this._element.onmousedown = null;
        this._element.ondragstart = null;
        this._elementWrapper.ondragstart = null;
        this._elementWrapper.style.touchAction = null;
    }

    private onMouseDown(_event: MouseEvent) {
        function pauseEvent(e: MouseEvent) {
            if (e.stopPropagation) { e.stopPropagation(); }
            if (e.preventDefault) { e.preventDefault(); }
            e.cancelBubble = true;
            e.returnValue = false;
            return false;
        }

        pauseEvent(_event);

        // Callbacks
        const onMouseMove = (event) => {
            moveAt(event.pageX, event.pageY);

            this._wrapperClone.hidden = true; // (*)
            const elementBelow = document.elementFromPoint(event.clientX, event.clientY);
            this._wrapperClone.hidden = false;

            // mousemove events may trigger out of the window
            // If so, elementFromPoint() returns null
            if (!elementBelow) {
                return;
            }

            // Its potential dropable if
            // ElementBelow is grandchild of a dragNDrop directive
            if (elementBelow !== this._element && elementBelow.parentElement) {
                if (elementBelow.parentElement.parentElement) {
                    const dragNDrop = elementBelow.parentElement.closest('[ng-reflect-drag-n-drop]');
                    const dropableBelow = <HTMLElement>elementBelow.parentElement.closest('[data-index]');

                    // It is potential dropable
                    if (dropableBelow && dragNDrop) {
                        this._dropableBelow = dropableBelow;
                        const potentialIndex = +this._dropableBelow.getAttribute('data-index');

                        // Make it call trigger only once
                        if (potentialIndex !== this._potentialIndex) {
                            this._potentialIndex = potentialIndex;

                            clearTimeout(this._holdingOverTimer);
                            this._holdingOverTimer = setTimeout(() => {
                                if (this._potentialIndex !== null && this._potentialIndex !== this._currentIndex) {
                                    this.indexChangeSource.next({from: this._currentIndex, to: this._potentialIndex});
                                    this.currentIndex = this._potentialIndex;
                                }
                            }, 500);
                        }
                    }
                }
            }
        };
        const moveAt = (pageX, pageY) => {
            this._wrapperClone.style.left = pageX - this._shiftX + 'px';
            this._wrapperClone.style.top = pageY - this._shiftY + 'px';
        };

        // Clone element
        this._wrapperClone = <HTMLElement>this._elementWrapper.cloneNode(true);
        this._elementClone = <HTMLElement>this._wrapperClone.firstElementChild;

        // Remove animations from draggable clone
        DragNDropItem.removeDraggableAnimations(this._elementClone);

        // Remember the click offsets
        this._shiftX = _event.clientX - this._elementWrapper.getBoundingClientRect().left;
        this._shiftY = _event.clientY - this._elementWrapper.getBoundingClientRect().top;

        // Prepare to move: make absolute clone and increase z-index
        this._wrapperClone.style.position = 'absolute';
        this._wrapperClone.style.zIndex = '1000';

        this._elementClone.style.width = this._element.clientWidth + 'px';
        this._elementClone.style.height = this._element.clientHeight + 'px';
        this._elementClone.style.boxShadow = '0px 0px 20px rgba(0,0,0,.7)';

        // Prepare to move: hide picked-up element
        this._elementWrapper.style.visibility = 'hidden';

        // Move it out of any current parents directly into body
        // To make it positioned relative to the body
        document.body.append(this._wrapperClone);

        // Put that absolutely positioned element under the cursor
        moveAt(_event.pageX, _event.pageY);

        // Move element on mousemove
        document.addEventListener('mousemove', onMouseMove);

        // Drop the element, remove unneeded handlers and animate clone into new element's position,
        this._wrapperClone.onmouseup = () => {
            document.removeEventListener('mousemove', onMouseMove);

            // Animate element into its new place
            this.putClone();

            // If element is dropped in new place, emit change and update current index
            if (this._potentialIndex !== null && this._potentialIndex !== this._currentIndex) {
                this.indexChangeSource.next({from: this._currentIndex, to: this._potentialIndex});
                this.currentIndex = this._potentialIndex;
            }
        };
    }

    private putClone() {
        // Helpers
        const getPositionDifference = (a, b) => {
            return {
                top: (-1 * (a.top - b.top)).toFixed(0),
                left: (-1 * (a.left - b.left)).toFixed(0),
            };
        };

        setTimeout(() => {
            const newPos = this._element.getBoundingClientRect();
            const currentPos = this._wrapperClone.getBoundingClientRect();
            const positionDifference = getPositionDifference(currentPos, newPos);

            this._wrapperClone.style.transition = `transform .3s ease`;
            this._wrapperClone.style.transform = `translate(${positionDifference.left}px, ${positionDifference.top}px)`;

            this._wrapperClone.addEventListener('transitionend', () => {
                this.removeClones();
            });
        });
    }

    public removeClones() {
        if (this._elementClone) {
            this._elementClone.parentElement.removeChild(this._elementClone);
        }

        if (this._wrapperClone) {
            this._wrapperClone.parentElement.removeChild(this._wrapperClone);
        }

        this._elementWrapper.style.visibility = null;
    }

    private killDragStartOnImages() {
        const imgs = <HTMLElement[]><unknown>this._elementWrapper.querySelectorAll('img');

        for (let i = 0; i < imgs.length; i++) {
            imgs[i].setAttribute('ondragstart', 'return false');
        }

    }

    private disableDragSelect() {

    }
}
