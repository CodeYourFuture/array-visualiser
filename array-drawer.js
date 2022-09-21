export class ArrayDrawer {
    constructor(draw, config) {
        this.draw = draw;
        this.config = config;
    }

    buildArrayGroup(array, id, opacity = 1) {
        let arrayGroup = this.draw.group().id(id);
        array.forEach((element, index) => {
            let xPosition = this.config.bezelWidth;
            let yPosition = this.config.bezelWidth + (index * (this.config.elementSize + this.config.elementSpacing));
            arrayGroup.add(this.buildArrayElement(element, String(index), xPosition, yPosition, opacity));
        });
        return arrayGroup;
    }
    
    buildArrayElement(value, index, x, y, opacity = 1) {
        let group = this.draw.nested().id(`element${index}`).opacity(opacity);
        group.add(this.draw.rect(this.config.elementSize, this.config.elementSize).id('container').fill(this.config.arrayColor).attr({ x, y, rx: 10, stroke: 'black' }));

        let valueText = this.buildText(value, `value${index}`, x, y);
        this.center(valueText, this.config.elementSize, this.config.elementSize * 0.65, x, y);
        group.add(valueText);

        let indexText = this.buildText(index, `index${index}`, x, y);
        this.center(indexText, this.config.elementSize, this.config.elementSize * 0.35, x, y + this.config.elementSize * 0.65);
        group.add(indexText);

        let linePosition = y + (this.config.elementSize * 0.65);
        group.add(this.draw.line(x, linePosition, x + this.config.elementSize, linePosition).stroke('black'));
        return group;
    }
    
    buildText(value, id, x, y) {
        return this.draw.text(value)
            .id(id)
            .fill('black')
            .attr({ 
                style: 'white-space: pre', 
                'font-family': 'Courier New', 
                'font-size': this.config.elementFontSize, 
                'font-weight': 'bold', 
                'letter-spacing': '0em',
                x,
                y,
            });
    }

    center(element, containingWidth, containingHeight, xOffset, yOffset) {
        element.attr({
            'text-anchor': 'middle',
            'dominant-baseline': 'middle',
            x: containingWidth / 2 + xOffset, 
            y: containingHeight / 2 + yOffset
        });
    }
}