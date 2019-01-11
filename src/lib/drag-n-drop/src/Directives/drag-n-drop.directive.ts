import {Directive, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {DragNDropItem} from '../Classes/drag-n-drop-item';
import {Subscription} from 'rxjs';

@Directive({
    selector: '[dragNDrop]'
})
export class DragNDropDirective implements OnInit, OnDestroy {
    @Output() reorder = new EventEmitter<{from: number, to: number}>();
    @Input() set dragNDrop(control: { array: any[], enabled: boolean }) {
        this.enable(control.enabled === true);
        this.array = control.array;
    }

    private _S: Subscription[] = [];
    private array: any[];
    private items: DragNDropItem[] = [];

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

    private async getItems(): Promise<number> {
        const items = await this.itemsContainer.children;
        for (let i = 0; i < items.length; i++) {
            this.items.push(new DragNDropItem(<HTMLElement>items[i], i));
        }

        return 0;
    }

    private enable(value: boolean) {
        if (value) {
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
