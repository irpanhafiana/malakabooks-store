import {
  Component,
  ElementRef,
  ViewChild,
  forwardRef,
  signal,
  inject,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ChangeDetectorRef,
  ChangeDetectionStrategy
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-editor',
  standalone: true,
  templateUrl: './editor.component.html',
  styleUrl: './editor.component.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => EditorComponent),
      multi: true
    }
  ]
})
export class EditorComponent implements ControlValueAccessor, OnInit, OnDestroy, AfterViewInit {
  @ViewChild('editor', { static: true }) editorRef!: ElementRef<HTMLDivElement>;
  @ViewChild('textarea', { static: true }) textareaRef!: ElementRef<HTMLTextAreaElement>;
  @ViewChild('imageInput', { static: true }) imageInputRef!: ElementRef<HTMLInputElement>;

  private readonly cdr = inject(ChangeDetectorRef);

  // Reusable Color Options
  readonly textColors = [
    '#000000', '#334155', '#475569', '#64748b', '#94a3b8',
    '#005e9c', '#003049', '#3b82f6', '#06b6d4', '#10b981',
    '#ef4444', '#d32f2f', '#f59e0b', '#8b5cf6', '#ec4899'
  ];

  readonly highlightColors = [
    '', '#fef08a', '#bbf7d0', '#bfdbfe', '#fbcfe8',
    '#fed7aa', '#ddd6fe', '#c084fc', '#f43f5e', '#22c55e'
  ];

  // Component States
  readonly isCodeView = signal(false);
  readonly showForeColorPicker = signal(false);
  readonly showHiliteColorPicker = signal(false);

  // Active styles at cursor
  readonly activeForeColor = signal('#334155');
  readonly activeHiliteColor = signal('');

  // ControlValueAccessor Callbacks
  onChange: (value: string) => void = () => { };
  onTouched: () => void = () => { };
  isDisabled = false;

  private selectionChangeHandler = () => this.updateToolbarState();

  ngOnInit() {
    // Listen to selection changes to dynamically highlight formatting state
    document.addEventListener('selectionchange', this.selectionChangeHandler);
  }

  ngOnDestroy() {
    document.removeEventListener('selectionchange', this.selectionChangeHandler);
  }

  ngAfterViewInit() {
    if (this.isDisabled) {
      this.setDisabledState(true);
    }
  }

  // --- ControlValueAccessor implementation ---
  writeValue(value: any): void {
    const val = value || '';
    if (this.editorRef) {
      this.editorRef.nativeElement.innerHTML = val || '<p><br></p>';
    }
    if (this.textareaRef) {
      this.textareaRef.nativeElement.value = val;
    }
  }

  /** Ensure editor has at least an empty paragraph so block-level commands work */
  private ensureEditorContent() {
    const editor = this.editorRef?.nativeElement;
    if (!editor) return;
    if (!editor.innerHTML || editor.innerHTML === '' || editor.innerHTML === '<br>') {
      editor.innerHTML = '<p><br></p>';
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
    if (this.editorRef) {
      this.editorRef.nativeElement.contentEditable = isDisabled ? 'false' : 'true';
    }
    if (this.textareaRef) {
      this.textareaRef.nativeElement.disabled = isDisabled;
    }
  }

  // --- Content Changes Sync ---
  onContentChange() {
    const html = this.editorRef.nativeElement.innerHTML;
    this.onChange(html);
    if (this.textareaRef) {
      this.textareaRef.nativeElement.value = html;
    }
  }

  onCodeChange(event: Event) {
    const value = (event.target as HTMLTextAreaElement).value;
    this.onChange(value);
    if (this.editorRef) {
      this.editorRef.nativeElement.innerHTML = value;
    }
  }

  // --- Rich Text Commands ---
  execCommand(command: string, value: string = '') {
    // Block-level commands need content to work on
    if (['insertUnorderedList', 'insertOrderedList', 'formatBlock'].includes(command)) {
      this.ensureEditorContent();
    }

    // Focus the editor if we are in rich text mode
    if (!this.isCodeView()) {
      this.editorRef.nativeElement.focus();
    }

    document.execCommand(command, false, value);
    this.onContentChange();
    this.updateToolbarState();
  }

  formatBlock(tag: string) {
    this.execCommand('formatBlock', `<${tag}>`);
  }

  // --- Color Selection ---
  toggleForeColorPicker() {
    this.showForeColorPicker.update(v => !v);
    this.showHiliteColorPicker.set(false);
  }

  toggleHiliteColorPicker() {
    this.showHiliteColorPicker.update(v => !v);
    this.showForeColorPicker.set(false);
  }

  setTextColor(color: string) {
    this.execCommand('foreColor', color);
    this.showForeColorPicker.set(false);
    this.activeForeColor.set(color);
  }

  setHighlightColor(color: string) {
    // 'hiliteColor' is standard for background highlight, falling back to 'backColor' for IE
    const cmd = document.queryCommandSupported('hiliteColor') ? 'hiliteColor' : 'backColor';
    this.execCommand(cmd, color || 'transparent');
    this.showHiliteColorPicker.set(false);
    this.activeHiliteColor.set(color);
  }

  // --- Insert Links / Media ---
  insertLink() {
    const url = prompt('Masukkan URL Link:', 'https://');
    if (url && url !== 'https://') {
      this.execCommand('createLink', url);
    }
  }

  insertImage() {
    this.imageInputRef.nativeElement.click();
  }

  onImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || !input.files[0]) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      this.editorRef.nativeElement.focus();
      document.execCommand('insertImage', false, base64);
      this.onContentChange();
      this.updateToolbarState();
    };
    reader.onerror = () => {
      console.error('Gagal membaca file gambar.');
    };
    reader.readAsDataURL(input.files[0]);
    input.value = ''; // reset so same file can be picked again
  }

  // --- View Code Mode Toggle ---
  toggleCodeView() {
    if (this.isCodeView()) {
      // Sync code from textarea to rich text area
      const val = this.textareaRef.nativeElement.value;
      this.editorRef.nativeElement.innerHTML = val;
      this.isCodeView.set(false);

      // Delay focus to let browser render the editor div
      setTimeout(() => this.editorRef.nativeElement.focus(), 50);
    } else {
      // Sync code from rich text area to textarea
      const val = this.editorRef.nativeElement.innerHTML;
      this.textareaRef.nativeElement.value = val;
      this.isCodeView.set(true);

      setTimeout(() => this.textareaRef.nativeElement.focus(), 50);
    }
    this.showForeColorPicker.set(false);
    this.showHiliteColorPicker.set(false);
  }

  // --- Detect Command States for Toolbar UI Highlights ---
  isActive(command: string): boolean {
    if (typeof document === 'undefined') return false;
    try {
      return document.queryCommandState(command);
    } catch {
      return false;
    }
  }

  private updateToolbarState() {
    if (typeof document === 'undefined' || this.isCodeView()) return;
    try {
      // Read active text colors
      const fore = document.queryCommandValue('foreColor');
      if (fore) this.activeForeColor.set(this.rgbToHex(fore));

      let back = '';
      try {
        back = document.queryCommandValue('hiliteColor') || document.queryCommandValue('backColor');
      } catch { }

      if (back && back !== 'rgba(0, 0, 0, 0)' && back !== 'transparent') {
        this.activeHiliteColor.set(this.rgbToHex(back));
      } else {
        this.activeHiliteColor.set('');
      }

      this.cdr.markForCheck();
    } catch { }
  }

  private rgbToHex(rgb: string): string {
    if (!rgb) return '';
    if (rgb.startsWith('#')) return rgb;

    const match = rgb.match(/^rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i);
    if (!match) return rgb;

    const r = parseInt(match[1], 10).toString(16).padStart(2, '0');
    const g = parseInt(match[2], 10).toString(16).padStart(2, '0');
    const b = parseInt(match[3], 10).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`;
  }

  // --- Keyboard Shortcuts / TAB handling ---
  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Tab') {
      event.preventDefault();
      // Insert 4 non-breaking spaces for tab inside code/text blocks
      this.execCommand('insertHTML', '&nbsp;&nbsp;&nbsp;&nbsp;');
    }
  }
}
