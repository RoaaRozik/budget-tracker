import { Directive, ElementRef, Input, OnInit, Renderer2 } from '@angular/core';

/**
 * Highlight Directive
 * Custom directive that highlights an element based on a condition
 * Usage: <div appHighlight [highlightCondition]="true">Content</div>
 * 
 * This demonstrates Angular directives - a way to add custom behavior to DOM elements
 */
@Directive({
  selector: '[appHighlight]',
  standalone: true // Standalone directive (Angular 15+)
})
export class HighlightDirective implements OnInit {
  /**
   * Input property to determine if element should be highlighted
   * The @Input decorator allows passing data from parent component
   */
  @Input() highlightCondition: boolean = false;
  @Input() highlightColor: string = '#ffeb3b'; // Default yellow

  constructor(
    private el: ElementRef, // Reference to the DOM element
    private renderer: Renderer2 // Angular's way to safely manipulate DOM
  ) {}

  ngOnInit(): void {
    // Apply highlight when condition is true
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

