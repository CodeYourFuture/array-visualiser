import { configBuilder } from './config.js';
import { ArrayDrawer } from './array-drawer.js';
import {
    moveHalfway,
    moveToEnd,
    updateElementText, 
    updateElementIndex, 
    updateElementColor, 
    convertArrayElementToValue, 
    convertArrayIndexToValue
} from './animate.js';
import { questionAndAnswers } from './questionAndAnswers.js';

const params = new URLSearchParams(window.location.search);
let defaultValues = {
    array: params.get('array') ? params.get('array') : JSON.stringify(['apple', 'orange', 'banana']),
    valueFunction: params.get('valueFunction') ? params.get('valueFunction') : v => v.toUpperCase(),
    mode: params.get('mode') ? params.get('mode'): 'map'
}

let {array, valueFunction, mode} = defaultValues;
let config = configBuilder(array);
initializeConsole();
initializeValues();
initializeWidths();
initializeQuestions();
setUpEventListeners();
go();

function initializeConsole() {
    let oldLog = console.log;
    console.log = message => {
        document.getElementById('consoleOutput').innerText += message + '\n';
        oldLog(message);
    };
}

function initializeValues() {
    document.getElementById('array').innerText = array;
    document.getElementById('valueFunction').innerText = valueFunction;
    document.getElementById('mode').value = mode;
}

function initializeWidths() {
    document.getElementById('controls').style.width = document.body.clientWidth - 45;
    updateModeWidth();
}

function initializeQuestions() {
    let questions = document.getElementById('questions');
    removeAllChildNodes(questions);

    questionAndAnswers[document.getElementById('mode').value].forEach(qAndA => {
        let button = document.createElement('button');
        button.className = 'accordion';
        button.innerText = qAndA.q;
        questions.appendChild(button);

        let div = document.createElement('div');
        div.className = 'panel';

        let p = document.createElement('p');
        p.innerHTML = qAndA.a;
        div.appendChild(p);

        questions.appendChild(div);
    });

    let acc = document.getElementsByClassName("accordion");
    let i;
    
    for (let i = 0; i < acc.length; i++) {
      acc[i].addEventListener("click", function() {
        let currentPanel = this.nextElementSibling;

        let panels = document.querySelectorAll('.panel');
        panels = [...panels];
        panels.filter(panel => panel !== currentPanel)
            .forEach(panel => {
                panel.style.display = "none";
            });

        if (currentPanel.style.display === "block") {
            currentPanel.style.display = "none";
        } else {
            currentPanel.style.display = "block";
        }
      });
    }
}

function removeAllChildNodes(parent) {
    while (parent.firstChild) {
        parent.removeChild(parent.firstChild);
    }
}

function setUpEventListeners() {
    document.getElementById('controlForm').addEventListener('submit', go);
    document.getElementById('array').addEventListener('keydown', submitHandler);
    document.getElementById('valueFunction').addEventListener('keydown', submitHandler);
    document.getElementById('mode').addEventListener('change', _ => {
        updateModeWidth();
        initializeQuestions();
    });
    document.getElementById('copyButton').addEventListener('click', copyCodeToClipboard);
    document.getElementById('shareButton').addEventListener('click', copyURLToClipboard);
}

function copyCodeToClipboard(event) {
    event.preventDefault();
    let code = 'let arr = ' + document.getElementById('array').innerText + ';\n';
    code += `arr.${document.getElementById('mode').value}(${document.getElementById('valueFunction').innerText});`;
    navigator.clipboard.writeText(code);
}

function copyURLToClipboard(event) {
    event.preventDefault();
    navigator.clipboard.writeText(buildURL());
}

function submitHandler(event) {
    if(event.keyCode == 13) {
        event.preventDefault();
        go(event);
    }
}

function updateModeWidth() {
    document.getElementById('mode').style.width = `${document.getElementById('mode').value.length * 18}px`;
}

function buildURL() {
    let params = new URLSearchParams()
    params.append('array', document.getElementById('array').innerText);
    params.append('mode', mode);
    params.append('valueFunction', document.getElementById('valueFunction').innerText);    
    return `${window.location.href.split('?')[0]}?${params.toString()}`;
}

function go(event) {
    if(event) event.preventDefault();
    document.getElementById('consoleOutput').innerText = '';
    document.getElementById('consoleOutput').classList.remove('error');
    try {
        array = JSON.parse(document.getElementById('array').innerText);
    } catch(e) {
        document.getElementById('consoleOutput').className = 'error';
        document.getElementById('consoleOutput').innerText = e.message;
        throw e;
    }
    
    config = configBuilder(array);

    try {
        valueFunction = new Function("return " + document.getElementById('valueFunction').innerText)();
    } catch(e) {
        document.getElementById('consoleOutput').className = 'error';
        document.getElementById('consoleOutput').innerText = e.message;
        throw e;
    }

    mode = document.getElementById('mode').value;

    let visualization = document.getElementById('visualization');
    if(visualization)
        visualization.remove();
    drawPanel(1);
    runAnimation(mode, 1);
}

function drawPanel(id) {
    let draw = SVG().id('visualization').addTo('#svgContainer').size(config.frameWidth, config.totalFrameHeight);
    let drawer = new ArrayDrawer(draw, config);

    let frameGroup = draw.group().id(`frame${id}`);
    frameGroup.add(draw.rect(config.frameWidth, config.totalFrameHeight).fill(config.backgroundColor).attr({ rx: 10 }));

    frameGroup.add(draw.rect(config.arrayPanelWidth, config.totalFrameHeight).fill('#4DD0E1').attr({ x: 0, y: 0, rx: 10, 'fill-opacity': 0.25 }));
    let originalArrayText = buildText(draw, 'Original Array');
    center(originalArrayText, config.arrayPanelWidth, config.infoFrameHeight, 0, config.totalFrameHeight - config.infoFrameHeight);
    frameGroup.add(originalArrayText);
    frameGroup.add(drawer.buildArrayGroup(array, `staticArray${id}`));
    
    frameGroup.add(draw.rect(config.arrayPanelWidth, config.totalFrameHeight).fill('#81C784').attr({ x: config.frameWidth - config.arrayPanelWidth, y: 0, rx: 10, 'fill-opacity': 0.25 }));
    let newArrayText = buildText(draw, 'Output');
    center(newArrayText, config.arrayPanelWidth, config.infoFrameHeight, config.frameWidth - config.arrayPanelWidth, config.totalFrameHeight - config.infoFrameHeight);
    frameGroup.add(newArrayText);
    frameGroup.add(drawer.buildArrayGroup(array, `movingArray${id}`, 0));

    frameGroup.add(draw.line(0, config.arrayFrameHeight, config.frameWidth, config.arrayFrameHeight).stroke({ width: 2, color: '#455A64' }));

    frameGroup.add(draw.rect(config.infoBoxWidth * 0.20, config.infoBoxHeight).fill('#FFF176').attr({ x: config.arrayPanelWidth + config.bezelWidth, y: config.arrayFrameHeight + config.bezelWidth, rx: 10, stroke: 'black', 'fill-opacity': 0.5 }));
    let method = buildFunctionText(draw, mode)
    center(method, config.infoBoxWidth * 0.20, config.infoBoxHeight, config.arrayPanelWidth + config.bezelWidth, config.arrayFrameHeight + config.bezelWidth);
    frameGroup.add(method);
    
    frameGroup.add(draw.rect(config.infoBoxWidth * 0.75, config.infoBoxHeight).fill('#FFF176').attr({ x: config.arrayPanelWidth + config.bezelWidth + config.infoBoxWidth * 0.25, y: config.arrayFrameHeight + config.bezelWidth, rx: 10, stroke: 'black', 'fill-opacity': 0.5 }));
    let functionText = buildFunctionText(draw, valueFunction)
    center(functionText, config.infoBoxWidth * 0.75, config.infoBoxHeight, config.arrayPanelWidth + config.bezelWidth + config.infoBoxWidth * 0.25, config.arrayFrameHeight + config.bezelWidth);
    frameGroup.add(functionText);
}

function center(element, containingWidth, containingHeight, xOffset, yOffset) {
    element.attr({
        'text-anchor': 'middle',
        'dominant-baseline': 'middle',
        x: containingWidth / 2 + xOffset, 
        y: containingHeight / 2 + yOffset
    });
}

function buildText(draw, value) {
    return draw.text(value).font({ family: 'Helvetica', size: config.elementFontSize })
}

function buildFunctionText(draw, value) {
    let valueToShow = JSON.stringify(value, (_, val) => val + '');
    valueToShow = valueToShow.slice(1, valueToShow.length - 1);
    return draw.text(valueToShow)
        .fill('black')
        .attr({ 
            style: 'white-space: pre', 
            'font-family': 'Courier New', 
            'font-size': config.elementFontSize, 
            'font-weight': 'bold', 
            'letter-spacing': '0em',
        });
}

async function runAnimation(mode, id) {
    if(mode === 'map') {
        await executeMap(id);
    } else if(mode === 'filter') {
        await executeFilter(id);
    } else if(mode === 'forEach') {
        await executeForEach(id);
    } else if(mode === 'find') {
        await executeFind(id);
    } else if(mode === 'findIndex') {
        await executeFindIndex(id);
    } else if(mode === 'findLast') {
        await executeFindLast(id);
    } else if(mode === 'findLastIndex') {
        await executeFindLastIndex(id);
    }
}

async function executeMap(id) {
    let movingArray = SVG(document.getElementById(`movingArray${id}`));
    for(let [index, element] of movingArray.children().entries()) {
        await moveHalfway(element, config);
        updateElementColor(element, config.mappedArrayColor);
        
        let newValue = runWithErrorHandling(() => valueFunction(array[index], index, array));
        updateElementText(element, newValue);
        
        element.opacity(1);
        await moveToEnd(element, config)
    }
}

async function executeFilter(id) {
    let movingArray = SVG(document.getElementById(`movingArray${id}`));
    let filteredElements = 0;
    for(let [index, element] of movingArray.children().entries()) {
        await moveHalfway(element, config);

        if(runWithErrorHandling(() => valueFunction(array[index], index, array))) {
            updateElementColor(element, config.mappedArrayColor);
            updateElementIndex(element, filteredElements);
            element.opacity(1);

            await moveToEnd(element, config, -((index - filteredElements) * (config.elementSize + config.elementSpacing)));
            filteredElements++;
        } else {
            updateElementColor(element, config.filteredOutColor);
        }
    }
}

async function executeForEach(id) {
    let movingArray = SVG(document.getElementById(`movingArray${id}`));
    let filteredElements = 0;
    for(let [index, element] of movingArray.children().entries()) {
        await moveHalfway(element, config);

        runWithErrorHandling(() => valueFunction(array[index], index, array));
        updateElementColor(element, config.mappedArrayColor);
        updateElementIndex(element, filteredElements);
    }
}

async function executeFind(id) {
    let movingArray = SVG(document.getElementById(`movingArray${id}`));
    for(let [index, element] of movingArray.children().entries()) {
        await moveHalfway(element, config);

        let currentValue = array[index];
        if(runWithErrorHandling(() => valueFunction(currentValue))) {
            updateElementColor(element, config.mappedArrayColor);
            convertArrayElementToValue(element);
            element.opacity(1);

            let distFromTop = (((array.length + 1) / 2) - 1) * (config.elementSize + config.elementSpacing) + (config.elementSize * 0.35 / 2);
            await moveToEnd(element, config, -(index * (config.elementSize + config.elementSpacing)) + distFromTop);
            return;
        } else {
            updateElementColor(element, config.filteredOutColor);
        }
    }
}

async function executeFindIndex(id) {
    let movingArray = SVG(document.getElementById(`movingArray${id}`));
    for(let [index, element] of movingArray.children().entries()) {
        await moveHalfway(element, config);

        let currentValue = array[index];
        if(runWithErrorHandling(() => valueFunction(currentValue))) {
            updateElementColor(element, config.mappedArrayColor);
            convertArrayIndexToValue(element);
            element.opacity(1);

            let distFromTop = (((array.length + 1) / 2) - 1) * (config.elementSize + config.elementSpacing) - (config.elementSize * 0.35 / 2);
            await moveToEnd(element, config, -(index * (config.elementSize + config.elementSpacing)) + distFromTop);
            return;
        } else {
            updateElementColor(element, config.filteredOutColor);
        }
    }
}

async function executeFindLast(id) {
    let movingArray = SVG(document.getElementById(`movingArray${id}`));
    for(let index = movingArray.children().length-1; index >= 0; index--) {
        let element = movingArray.children()[index];
        await moveHalfway(element, config);

        let currentValue = array[index];
        if(runWithErrorHandling(() => valueFunction(currentValue))) {
            updateElementColor(element, config.mappedArrayColor);
            convertArrayElementToValue(element);
            element.opacity(1);

            let distFromTop = (((array.length + 1) / 2) - 1) * (config.elementSize + config.elementSpacing) + (config.elementSize * 0.35 / 2);
            await moveToEnd(element, config, -(index * (config.elementSize + config.elementSpacing)) + distFromTop);
            return;
        } else {
            updateElementColor(element, config.filteredOutColor);
        }
    }
}

async function executeFindLastIndex(id) {
    let movingArray = SVG(document.getElementById(`movingArray${id}`));
    for(let index = movingArray.children().length-1; index >= 0; index--) {
        let element = movingArray.children()[index];
        await moveHalfway(element, config);

        let currentValue = array[index];
        if(runWithErrorHandling(() => valueFunction(currentValue))) {
            updateElementColor(element, config.mappedArrayColor);
            convertArrayIndexToValue(element);
            element.opacity(1);

            let distFromTop = (((array.length + 1) / 2) - 1) * (config.elementSize + config.elementSpacing) - (config.elementSize * 0.35 / 2);
            await moveToEnd(element, config, -(index * (config.elementSize + config.elementSpacing)) + distFromTop);
            return;
        } else {
            updateElementColor(element, config.filteredOutColor);
        }
    }
}

function runWithErrorHandling(f) {
    try {
        return f();
    } catch(e) {
        document.getElementById('consoleOutput').className = 'error';
        document.getElementById('consoleOutput').innerText = e.message;
        throw e;
    }
}