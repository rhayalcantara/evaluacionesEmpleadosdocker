import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-emojirating',
  standalone:true,
  imports:[FormsModule,CommonModule],
  templateUrl: './emojirating.component.html',
  styleUrls: ['./emojirating.component.css']
})
export class EmojiratingComponent {

}
