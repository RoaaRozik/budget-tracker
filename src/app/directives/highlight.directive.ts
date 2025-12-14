import { Directive, ElementRef, Input, OnInit, Renderer2 } from '@angular/core';


@Directive({
  selector: '[appHighlight]',
  standalone: true 
})
export class HighlightDirective implements OnInit {
 
  @Input() highlightCondition: boolean = false;
  @Input() highlightColor: string = '#ffeb3b'; 

  constructor(
    private el: ElementRef, 
    private renderer: Renderer2 
  ) {}

  ngOnInit(): void {
    if (this.highlightCondition) {
      this.renderer.setStyle(
        this.el.nativeElement,
        'background-color',
        this.highlightColor
      );
      this.renderer.setStyle(
        this.el.nativeElement,
        'padding',
        '4px 8px'
      );
      this.renderer.setStyle(
        this.el.nativeElement,
        'border-radius',
        '4px'
      );
    }
  }
}

