import {Directive, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {DragNDropItem} from '../Classes/drag-n-drop-item';
import {Subscription} from 'rxjs';
import {AnimateReorder} from '../Classes/animate-reorder';

@Directive({
    selector: '[dragNDrop]',
    providers: [
        AnimateReorder
    ]
})
export class DragNDropDirective implements OnInit, OnDestroy {
    @Output() reorder = new EventEmitter<{ from: number, to: number }>();
    private clone: HTMLElement;

    @Input() set dragNDrop(control: { array: any[], enabled: boolean }) {
        this.array = control.array;
        this.enabled = control.enabled === true;

        // noinspection JSIgnoredPromiseFromCall
        this.enable();
    }


    private _S: Subscription[] = [];
    private array: any[];
    private items: DragNDropItem[] = [];
    private enabled: boolean;

    private itemsContainer: HTMLElement;

    constructor(private hostRef: ElementRef,
                private animateReorder: AnimateReorder) {
    }

    /**
     * After component is initiated get all children
     * of a draggable items wrapper
     * */
    ngOnInit() {
        this.itemsContainer = this.hostRef.nativeElement;
        this.getItems().then(() => {
            this.listenToIndexChange();
        });
    }

    /**
     * Unsubscribe from all subscriptions on directive desroy
     * to prevent memory leaks
     * */
    ngOnDestroy() {
        this._S.forEach(s => s.unsubscribe());
    }

    updateArray() {
        const initialEnableState = this.enabled;
        this.enabled = false;
        // Disable drag
        // noinspection JSIgnoredPromiseFromCall
        this.enable();

        // Clear old items
        this.items = [];

        // Wait for one tick
        setTimeout(() => {
            // Get new items
            this.getItems().then(() => {
                this.listenToIndexChange();

                this.enabled = initialEnableState;
                // noinspection JSIgnoredPromiseFromCall
                this.enable();
            });
        });
    }

    /**
     * Gets HTML items
     * Constructs class for each item
     **/
    private async getItems(): Promise<number> {
        const items = await this.itemsContainer.children;
        for (let i = 0; i < items.length; i++) {
            this.items.push(new DragNDropItem(<HTMLElement>items[i], i));
        }

        //

        return 0;
    }

    private async enable() {
        for (let i = 0; this.items.length === 0; i++) {
            await this.wait(i < 10 ? (i + 1) * 100 : 1000);
        }

        if (this.enabled) {
            this.items.forEach(item => item.enable());
        } else {
            this.items.forEach(item => item.disable());
        }
    }

    private listenToIndexChange() {
        this.items.forEach(item => {
            this._S.push(item.emitIndexChange$.subscribe((change: { from: number, to: number }) => this.reorderArray(change)));
        });
    }

    private reorderArray(change: { from: number; to: number }) {
        // Emit the change to outside the directive
        this.reorder.emit(change);

        // Prepare animation by populating service with data
        this.animateReorder.previousArray = this.array;
        this.animateReorder.previousItems = this.items;
        this.animateReorder.container = this.hostRef;
        this.animateReorder.prepareForAnimation(change.from);

        // Item as in array element
        const movedArrayElement = this.array.splice(change.from, 1)[0];
        this.array.splice(change.to, 0, movedArrayElement);

        // Reference as in actual HTML element
        const movedHtmlElement = this.items.splice(change.from, 1)[0];
        this.items.splice(change.to, 0, movedHtmlElement);

        // Update indexes
        setTimeout(() => { // Needs to be on the other CPU tick to notice change
            this.animateReorder.newArray = this.array;
            this.animateReorder.newItems = this.items;
            this.animateReorder.performAnimation(change.from).then((pickedElementsIndex) => {
                this.items.forEach((item, index) => {
                    if (index !== pickedElementsIndex) {
                        // item.removeClones();
                    }
                });
            });
            this.updateIndexes();
        }, 0);
    }

    /**
     * Updates every DragNDropItem classes' index attribute
     * according to actual DOM position
     **/
    private async updateIndexes() {
        const items = await this.itemsContainer.children;
        for (let i = 0; i < items.length; i++) {
            this.items[i].currentIndex = i;
        }
    }

    /**
     * Helper function to do async wait
     **/
    protected async wait(delay) {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve();
            }, delay);
        });
    }

    private makeCopy() {
        const getElementMargin = () => {
            let elementHeight = this.hostRef.nativeElement.clientHeight;  // height with padding

            elementHeight += parseFloat(getComputedStyle(this.hostRef.nativeElement).marginTop);
            return parseFloat(getComputedStyle(this.hostRef.nativeElement).marginTop);
        };

        // Remove clone
        if (this.clone) {
            this.hostRef.nativeElement.parentNode.removeChild(this.clone);
        }

        // Clone current draggable container
        this.clone = this.hostRef.nativeElement.cloneNode(true);

        // Height to 0 so it would not impact document layout
        this.clone.style.height = '0';

        // Move clone to cover original element
        this.clone.style.transform = `translateY(${getElementMargin()}px)`;

        this.hostRef.nativeElement.parentNode.insertBefore(this.clone, this.hostRef.nativeElement);
    }


}
