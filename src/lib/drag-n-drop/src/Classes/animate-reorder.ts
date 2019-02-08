import {DragNDropItem} from './drag-n-drop-item';
import {ElementRef, Injectable} from '@angular/core';

interface ItemPosition {
    id: number;
    previousPosition: ClientRect;
    currentPosition: ClientRect;
    element: HTMLElement;
    item: DragNDropItem;
}

interface PositionDifference {
    top: string;
    right: string;
    bottom: string;
    left: string;
}

@Injectable()
export class AnimateReorder {
    private _animationContainer: HTMLElement;
    private _items: ItemPosition[];

    container: ElementRef;
    newArray: any[];
    previousArray: any[];

    set previousItems(items: DragNDropItem[]) {
        this._items = this.parseItemsPosition(items);
    }

    set newItems(items: DragNDropItem[]) {
        this.parseNewItemsPosition(items);
    }

    /**
     * Calculates difference between element's previous and current positions
     **/
    public static getPositionDifference(item: ItemPosition): PositionDifference {
        return {
            top: (-1 * (item.previousPosition.top - item.currentPosition.top)).toFixed(0),
            right: (-1 * (item.previousPosition.right - item.currentPosition.right)).toFixed(0),
            bottom: (-1 * (item.previousPosition.bottom - item.currentPosition.bottom)).toFixed(0),
            left: (-1 * (item.previousPosition.left - item.currentPosition.left)).toFixed(0),
        };
    }

    /**
     * Creates copy of the original container
     * Inserts the copy into the DOM and
     * hides original container.
     * Make sure to run this before performing reorder animations
     **/
    prepareForAnimation(pickedElementsIndex: number): void {
        if (!this._items || !this.container) {
            return;
        }

        // Make original container copy, it will be animate
        this.makeContainerCopy().then(() => {
            // Make original container invisible
            this.container.nativeElement.style.visibility = 'hidden';

            this._items.forEach(async (item, index) => {
                if (!item.element) {
                    return;
                }

                // Hide picked element from container
                if (index === pickedElementsIndex) {
                    item.element.style.opacity = '.2';
                }
            });

            // Insert animation (the copy of original) container
            this.container.nativeElement.parentNode.insertBefore(this._animationContainer, this.container.nativeElement);
        });
    }

    /**
     * Performs interpolation between two positions
     * for each DOM element which has to move
     **/
    async performAnimation(pickedElementsIndex: number): Promise<number> {
        if (!this._items || !this.container) {
            return;
        }

        return <number><unknown>new Promise((resolve) => {

            let listening = false;

            // Make container copy, it will be animate
            this._items.forEach(async (item, index) => {
                if (!item.element) {
                    return;
                }

                const positionDifference: PositionDifference = AnimateReorder.getPositionDifference(item);

                if (index !== pickedElementsIndex) {
                    // Set transition animations
                    item.element.style.transition = `transform .3s ease`;

                    // Checks if listening for the transition end
                    if (!listening) {
                        item.element.addEventListener('transitionend', () => {
                            // Remove animation container from DOM
                            this._animationContainer.parentElement.removeChild(this._animationContainer);
                            this.container.nativeElement.style.visibility = null;
                            resolve(pickedElementsIndex);
                        });

                        listening = true;
                    }
                }

                // Move elements with interpolation
                item.element.style.transform = `translate(${positionDifference.left}px, ${positionDifference.top}px)`;
            });
        });
    }

    /**
     * Saves old position and other important attributes of each element
     * in this class instance's _items attribute
     **/
    protected parseItemsPosition(items: DragNDropItem[]): ItemPosition[] {
        const result: ItemPosition[] = [];

        items.forEach((item) => {
            result.push({
                id: item.localId,
                previousPosition: item.elementWrapper.getBoundingClientRect(),
                currentPosition: null,
                element: null,
                item: item,
            });
        });

        return result;
    }

    /**
     * Updates _items attribute by populating each elements currentPosition attribute
     **/
    protected parseNewItemsPosition(items: DragNDropItem[]): void {
        items.forEach((item) => {
            this.getItem(item.localId).currentPosition = item.elementWrapper.getBoundingClientRect();
        });
    }

    protected getItem(localId: number): ItemPosition {
        let resultItem: ItemPosition = null;
        this._items.some((item) => {
            if (item.id === localId) {
                resultItem = item;
                return true;
            }
        });

        return resultItem;
    }

    protected wait(delay: number): Promise<null> {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve();
            }, delay);
        });
    }

    private async makeContainerCopy() {
        const getHeight = (): number => {
            const margin = parseInt(getComputedStyle(this.container.nativeElement).getPropertyValue('margin'), 0);

            if (margin < 0) {
                return margin * -1;
            }

            return 0;
        };
        // Make clone of drag and drop container
        this._animationContainer = this.container.nativeElement.cloneNode(true);

        // Make sure clone will not influence document layout
        this._animationContainer.style.height = `${getHeight()}px`;

        // Populate _items attribute with cloned elements
        const children = await this._animationContainer.children;
        for (let i = 0; i < children.length; i++) {
            const child: HTMLElement = <HTMLElement>children[i];
            const itemPosition = this.getItem(+child.getAttribute('data-local-id'));
            itemPosition.element = <HTMLElement>child;

            // For debug purposes only
            // child.style.background = 'red';
        }
    }
}
