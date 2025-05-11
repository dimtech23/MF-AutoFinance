declare module 'pdfkit' {
    class PDFDocument {
        constructor(options?: {
            size?: string | [number, number];
            margin?: number | { top?: number; bottom?: number; left?: number; right?: number };
            layout?: 'portrait' | 'landscape';
            bufferPages?: boolean;
            autoFirstPage?: boolean;
            info?: {
                Title?: string;
                Author?: string;
                Subject?: string;
                Keywords?: string;
                CreationDate?: Date;
                ModDate?: Date;
                Creator?: string;
                Producer?: string;
            };
        });

        // Add y property
        y: number;

        // Text operations
        text(text: string, x?: number | {
            width?: number;
            height?: number;
            align?: 'left' | 'center' | 'right' | 'justify';
            lineBreak?: boolean;
            continued?: boolean;
            underline?: boolean;
        }, y?: number, options?: {
            width?: number;
            height?: number;
            align?: 'left' | 'center' | 'right' | 'justify';
            lineBreak?: boolean;
            continued?: boolean;
            underline?: boolean;
        }): this;
        font(font: string, size?: number): this;
        fontSize(size: number): this;
        textColor(color: string): this;
        fillColor(color: string): this;
        strokeColor(color: string): this;

        // Positioning
        moveDown(lines?: number): this;
        moveUp(lines?: number): this;
        moveTo(x: number, y: number): this;

        // Graphics
        rect(x: number, y: number, width: number, height: number): this;
        roundedRect(x: number, y: number, width: number, height: number, radius: number): this;
        circle(x: number, y: number, radius: number): this;
        ellipse(x: number, y: number, rx: number, ry: number): this;
        lineCap(cap: 'butt' | 'round' | 'square'): this;
        lineJoin(join: 'miter' | 'round' | 'bevel'): this;
        lineWidth(width: number): this;

        // Images
        image(src: string | Buffer, x?: number, y?: number, options?: {
            width?: number;
            height?: number;
            scale?: number;
            fit?: [number, number];
            align?: 'left' | 'center' | 'right';
            valign?: 'top' | 'center' | 'bottom';
        }): this;

        // Page operations
        addPage(options?: {
            size?: string | [number, number];
            margin?: number | { top?: number; bottom?: number; left?: number; right?: number };
            layout?: 'portrait' | 'landscape';
        }): this;
        switchToPage(pageNumber: number): this;

        // Document operations
        pipe(destination: NodeJS.WritableStream): this;
        end(): void;
        flushPages(): void;
        save(): Promise<Buffer>;

        // Tables
        table(rows: any[], options?: {
            prepareHeader?: () => void;
            prepareRow?: (row: any, index: number) => void;
            columnSpacing?: number;
            rowSpacing?: number;
            headerColor?: string;
            headerHeight?: number;
            rowHeight?: number;
            columnWidth?: number | number[];
        }): this;

        // Lists
        list(items: string[], options?: {
            bulletRadius?: number;
            textIndent?: number;
            bulletIndent?: number;
            continued?: boolean;
        }): this;

        // Links
        link(x: number, y: number, width: number, height: number, url: string): this;
        goToPage(pageNumber: number, options?: { top?: number; left?: number }): this;

        // Transformations
        rotate(angle: number, options?: { origin?: [number, number] }): this;
        scale(x: number, y?: number, options?: { origin?: [number, number] }): this;
        translate(x: number, y: number): this;
        transform(a: number, b: number, c: number, d: number, e: number, f: number): this;

        // Path operations
        path(path: string): this;
        fill(color?: string, rule?: 'nonzero' | 'evenodd'): this;
        stroke(color?: string): this;
        fillAndStroke(fillColor?: string, strokeColor?: string): this;

        // Clipping
        clip(): this;
        clipEvenOdd(): this;

        // Vector operations
        bezierCurveTo(cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number): this;
        quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): this;
        arc(x: number, y: number, radius: number, startAngle: number, endAngle: number, anticlockwise?: boolean): this;

        // State management
        save(): this;
        restore(): this;
    }

    export = PDFDocument;
} 