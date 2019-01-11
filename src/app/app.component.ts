import {Component} from '@angular/core';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})
export class AppComponent {
    drag = false;

    items = [
        {name: '1'},
        {name: '2'},
        {name: '3'},
        {name: '4'},
        {name: '5'},
    ];

    items2 = [
        {image: '/assets/1.jpg'},
        {image: '/assets/2.jpg'},
        {image: '/assets/3.jpg'},
        {image: '/assets/4.jpg'},
        {image: '/assets/5.jpg'},
        {image: '/assets/6.jpg'},
    ];
}
