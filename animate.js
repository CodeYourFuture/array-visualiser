export async function moveHalfway(element, config) {
    await waitForRunner(element.animate(750, 100, 'now')
        .ease('>')
        .attr({
            x: config.halfwayPosition,
            opacity: 0.5
        })
    );
}

export async function moveToEnd(element, config, moveY) {
    await waitForRunner(element.animate(500, 250, 'now')
        .ease('<')
        .attr({
            x: config.endPosition,
            y: moveY ? moveY : 0
        }));
}

export function updateElementText(element, newValue) {
    transformTextNode(element.children()[1], String(newValue));
}

export function updateElementIndex(element, newIndex) {
    transformTextNode(element.children()[2], String(newIndex));
}

export function updateElementColor(element, newColor) {
    let container = element.children()[0];
    container.fill(newColor);
}

export function convertArrayElementToValue(element) {
    element.children()[3].remove();
    element.children()[2].remove();

    let currentHeight = element.children()[0].attr('height');
    element.children()[0].animate(500, 250, 'now').attr({
        height: currentHeight * 0.65
    });
}

export function convertArrayIndexToValue(element) {
    element.children()[3].remove();
    element.children()[1].remove();

    let rect = element.children()[0];
    let currentHeight = rect.attr('height');
    let currentY = rect.attr('y');
    rect.animate(500, 250, 'now').attr({
        height: currentHeight * 0.35,
        y: currentY + (currentHeight * 0.65)
    });
}

function transformTextNode(node, newValue) {
    node.children()[0].text(newValue);
}

async function waitForRunner(runner) {
    return new Promise(function(resolve) { 
        runner.after(() => {
            resolve();
        });
    });
}