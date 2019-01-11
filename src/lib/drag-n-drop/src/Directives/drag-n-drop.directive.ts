import {Directive, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {DragNDropItem} from '../Classes/drag-n-drop-item';
import {Subscription} from 'rxjs';

@Directive({
    selector: '[dragNDrop]'
})
export class DragNDropDirective implements OnInit, OnDestroy {
    @Output() reorder = new EventEmitter<{ from: number, to: number }>();

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

    constructor(private hostRef: ElementRef) {
    }

    /*
    * After component is initiated get all children
    * of a draggable items wrapper
    * */
    ngOnInit() {
        this.itemsContainer = this.hostRef.nativeElement;
        this.getItems().then(() => {
            this.listenToIndexChange();
        });
    }

    /*
    * Unsubscribe from all subscriptions on directive desroy
    * to prevent memory leaks
    * */
    ngOnDestroy() {
        this._S.forEach(s => s.unsubscribe());
    }

    updateArray() {
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

                this.enabled = true;
                // noinspection JSIgnoredPromiseFromCall
                this.enable();
            });
        });
    }

    private async wait(delay) {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve();
            }, delay);
        });
    }

    /**
     * Gets HTML items
     * Constructs class for each item
     **/
    private async getItems(): Promise<number> {
        const items = await this.itemsContainer.children;
        console.log(items);
        for (let i = 0; i < items.length; i++) {
            this.items.push(new DragNDropItem(<HTMLElement>items[i], i));
        }

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
        this.reorder.emit(change);

        const movedItem = this.array.splice(change.from, 1)[0];
        this.array.splice(change.to, 0, movedItem);

        const movedReference = this.items.splice(change.from, 1)[0];
        this.items.splice(change.to, 0, movedReference);

        // Update indexes
        setTimeout(() => { // Needs to be on the other CPU tick to notice change
            this.updateIndexes();
        });
    }

    private async updateIndexes() {
        const items = await this.itemsContainer.children;
        for (let i = 0; i < items.length; i++) {
            this.items[i].currentIndex = i;
        }
    }
}
