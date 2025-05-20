declare module 'pdfkit' {
    interface TextOptions {
        align?: 'left' | 'center' | 'right' | 'justify';
        width?: number;
        height?: number;
        lineBreak?: boolean;
        continued?: boolean;
        underline?: boolean;
        strike?: boolean;
        link?: string;
        indent?: number;
        columns?: number;
        columnGap?: number;
        wordSpacing?: number;
        characterSpacing?: number;
        fill?: boolean;
        stroke?: boolean;
        lineGap?: number;
        paragraphGap?: number;
        listType?: 'bullet' | 'numbered';
        bulletRadius?: number;
        bulletIndent?: number;
        textIndent?: number;
        ellipsis?: boolean;
        features?: { liga?: boolean; rlig?: boolean };
        [key: string]: any;
    }

    class PDFDocument {
        constructor(options?: {
            size?: string | [number, number];
            margin?: number | { top?: number; bottom?: number; left?: number; right?: number };
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
            [key: string]: any;
        });

        y: number;

        pipe(destination: any): this;
        end(): void;
        addPage(): this;
        fontSize(size: number): this;
        text(text: string, x?: number | TextOptions, y?: number, options?: TextOptions): this;
        moveDown(count?: number): this;
        font(font: string): this;
        fill(color: string): this;
        stroke(color: string): this;
        lineWidth(width: number): this;
        rect(x: number, y: number, width: number, height: number): this;
        circle(x: number, y: number, radius: number): this;
        image(src: any, x: number, y: number, options?: any): this;
        save(): this;
        restore(): this;
        translate(x: number, y: number): this;
        rotate(angle: number, options?: any): this;
        scale(x: number, y: number): this;
        transform(a: number, b: number, c: number, d: number, e: number, f: number): this;
        path(path: string): this;
        moveTo(x: number, y: number): this;
        lineTo(x: number, y: number): this;
        bezierCurveTo(cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number): this;
        quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): this;
        arc(x: number, y: number, radius: number, startAngle: number, endAngle: number, anticlockwise?: boolean): this;
        closePath(): this;
        fillAndStroke(): this;
        fillColor(color: string): this;
        strokeColor(color: string): this;
        lineCap(cap: 'butt' | 'round' | 'square'): this;
        lineJoin(join: 'miter' | 'round' | 'bevel'): this;
        miterLimit(limit: number): this;
        dash(length: number, options?: { space?: number; phase?: number }): this;
        undash(): this;
        opacity(opacity: number): this;
        fillOpacity(opacity: number): this;
        strokeOpacity(opacity: number): this;
        link(x: number, y: number, width: number, height: number, url: string): this;
        note(x: number, y: number, width: number, height: number, contents: string, options?: any): this;
        highlight(x: number, y: number, width: number, height: number, options?: any): this;
        underline(x: number, y: number, width: number, height: number, options?: any): this;
        strike(x: number, y: number, width: number, height: number, options?: any): this;
        list(items: string[], x: number, y: number, options?: any): this;
        table(rows: any[], x: number, y: number, options?: any): this;
        vector(x: number, y: number, width: number, height: number, options?: any): this;
        ellipse(x: number, y: number, rx: number, ry: number): this;
        polygon(points: [number, number][]): this;
        star(x: number, y: number, points: number, outerRadius: number, innerRadius: number): this;
        roundedRect(x: number, y: number, width: number, height: number, radius: number): this;
        sector(x: number, y: number, radius: number, startAngle: number, endAngle: number, options?: any): this;
        clip(): this;
        unclip(): this;
        bufferedPageRange(): { start: number; count: number };
        switchToPage(page: number): this;
    }

    export = PDFDocument;
} 