import {Subject} from 'rxjs';

export class DragNDropItem {
    private _wrapperClone: HTMLElement;
    private _elementClone: HTMLElement;
    private readonly _element: HTMLElement;
    private _shiftX: number;
    private _shiftY: number;
    private _potentialIndex: number = null;

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
    }

    enable() {
        DragNDropItem.addDraggableAnimations(this._elementWrapper);
        this._elementWrapper.style.cursor = 'move';
        this.addEvents();
    }

    disable() {
        DragNDropItem.removeDraggableAnimations(this._elementWrapper);
        this._elementWrapper.style.cursor = null;
        this.removeEvents();
    }

    private addEvents() {
        this._elementWrapper.onmousedown = event => this.onMouseDown(event);
        this._elementWrapper.ondragstart = () => false;
        this._elementWrapper.style.touchAction = 'none';

        this.killDragStartOnImages();
    }

    private removeEvents() {
        this._elementWrapper.onmousedown = null;
        this._elementWrapper.ondragstart = null;
        this._elementWrapper.style.touchAction = null;
    }

    private onMouseDown(_event: MouseEvent) {
        // Callbacks
        const onMouseMove = (event) => {
            moveAt(event.pageX, event.pageY);

            this._wrapperClone.hidden = true; // (*)
            const elementBelow = document.elementFromPoint(event.clientX, event.clientY);
            this._wrapperClone.hidden = false;

            // mousemove events may trigger out of the window
            // If so, elementfromPoint returns null
            if (!elementBelow) {
                return;
            }

            // Its potential dropable if
            // ElementBelow is grandchild of a dragNDrop directive
            if (elementBelow !== this._element && elementBelow.parentElement) {
                if (elementBelow.parentElement.parentElement) {
                    const dragNDrop = elementBelow.parentElement.closest('[ng-reflect-drag-n-drop]');
                    const dropableBelow = elementBelow.parentElement.closest('[data-index]');
                    if (dropableBelow && dragNDrop) {
                        const potentialIndex = +dropableBelow.getAttribute('data-index');
                        if (potentialIndex !== this._potentialIndex) {
                            this._potentialIndex = potentialIndex;
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
        setTimeout(() => { // Run this on next tick
            DragNDropItem.removeDraggableAnimations(this._elementClone);
        });

        // Remember the click offsets
        this._shiftX = _event.clientX - this._elementWrapper.getBoundingClientRect().left;
        this._shiftY = _event.clientY - this._elementWrapper.getBoundingClientRect().top;

        // Prepare to move: make absolute clone and increase z-index
        this._wrapperClone.style.position = 'absolute';
        this._wrapperClone.style.zIndex = '1000';
        this._wrapperClone.style.width = this._elementWrapper.offsetWidth + 'px';
        this._wrapperClone.style.height = this._elementWrapper.offsetHeight + 'px';
        this._elementClone.style.boxShadow = '0px 0px 20px rgba(0,0,0,.7)';

        // Prepare to move: change opacity of original
        this._elementWrapper.style.opacity = '.1';

        // Move it out of any current parents directly into body
        // To make it positioned relative to the body
        document.body.append(this._wrapperClone);

        // Put that absolutely positioned element under the cursor
        moveAt(_event.pageX, _event.pageY);

        // Move element on mousemove
        document.addEventListener('mousemove', onMouseMove);

        // Drop the element, remove unneeded handlers and clone,
        // Restore original element's opacity
        this._wrapperClone.onmouseup = () => {
            document.removeEventListener('mousemove', onMouseMove);
            this._wrapperClone.parentNode.removeChild(this._wrapperClone);
            this._elementWrapper.style.opacity = null;

            console.log({from: this._currentIndex, to: this._potentialIndex});

            if (this._potentialIndex !== null && this._potentialIndex !== this._currentIndex) {
                console.log('Emiting', {from: this._currentIndex, to: this._potentialIndex});
                this.indexChangeSource.next({from: this._currentIndex, to: this._potentialIndex});
                this.currentIndex = this._potentialIndex;
            }
        };
    }

    private killDragStartOnImages() {
        const imgs = <HTMLElement[]><unknown>this._element.querySelectorAll('img');

        for (let i = 0; i < imgs.length; i++) {
            imgs[i].setAttribute('ondragstart', 'return false');
        }

    }
}
