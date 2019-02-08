# Angular Drag and Drop sorting grid
Angular directive that allows you to build any type of sortable array HTML structure using native JavaScript mouse events. 

## Demo [StackBlitz](https://drag-n-drop-demo.stackblitz.io/ "StackBlitz live demo")

### Upcoming updates
* **Responsiveness:** make this code mobile-friendly;
* **Animations:** animate transitions between old and new positions; (done v1.2.0)
* **Usability:** make pure JavaScript version of code.
* **Functionality:** Dragging from one Array to the other


### Want to contribute?
Make a pull request!

# Getting started

* [Getting started - installation](#Installation)
* [Guide - how to use (live examples)](#How-to-use)
  * [Example #1 - flexbox](#Example-1)
  * [Example #2 - toggable drag & drop](#Example-2`)
  * [Example #3 - reorder callback + update array](#Example-3)

## Installation
###### #1 Install package
Run `npm install @rr2/drag-n-drop --save`

###### #2 Implement package
Add `DragNDropModule` to in your module.ts file
``` 
...
import {DragNDropModule} from '@rr2/drag-n-drop'; 

@NgModule({
    declarations: [
        ...
    ],
    imports: [
        ...
        DragNDropModule
    ],
    providers: [
        ...
    ],
    bootstrap: [
        ....
    ]
})
```


## How to use

#### Example 1 

[Live demo](https://stackblitz.com/edit/drag-n-drop-example-1 "StackBlitz Example 1")

Most simple example using `*ngFor` and `display: flex`

In your component file
```
@Component({
    ...
})
export class ... {
    ...
    
    yourArray = [
        {name: '1'},
        {name: '2'},
        {name: '3'},
        {name: '4'},
        {name: '5'},
    ];
    
    ...
}
```

In your template file:

```
<div [dragNDrop]="{array: yourArray, enabled: true}" style="display: flex; flex-wrap: wrap;">
    <div *ngFor="let element of yourArray;">

        <!-- Here goes HTML of the element which is sortable -->
        <div style="width: 25%; height: 150px; background: purple;">{{ element.name }}</div> 

    </div>
</div>
```

#### Example 2 [live demo](https://stackblitz.com/edit/drag-n-drop-example-2 "StackBlitz Example 1")

###### Toggleable drag and drop with some animations and more styling


#### Example 3 [live demo](https://stackblitz.com/edit/drag-n-drop-example-3 "StackBlitz Example 1")

###### Reorder callback

To use **re-oder callback** add `(reorder)="<callback>"` to `dragNDrop` html element with directive. 
Callback event returns object of array index change `{from: number, to: number}`

```
<div [dragNDrop]="{array: items, enabled: drag}" (reorder)="onReorder($event)">
```

Create method in the component
```
onReorder(indexChange: {from: number, to: number}) {
  console.log('Index changed:', indexChange); 
}
```

###### Modifying array dynamically

After adding or removing element to array, call `updateArray()` function from the directive.

```
...
import { DragNDropDirective } from '@rr2/drag-n-drop';

@Component({
  ...
})  
export class ... {
    @ViewChild(DragNDropDirective) dragNDropDirective;
    
    ...
    
    add() {
      ... // Add element
      this.dragNDropDirective.updateArray();
    }
    
    remove() {
      ... // Remove element
      this.dragNDropDirective.updateArray();
    }
}
```