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
    array: params.get('array') ? params.get('array') : JSON.stringify([5, 20, 30]),
    valueFunction: params.get('valueFunction') ? params.get('valueFunction') : "function(num) {return num * 2;}",
    mode: params.get('mode') ? params.get('mode'): 'map'
}

let {array, valueFunction, mode} = defaultValues;
let config = configBuilder(JSON.parse(array));
initializeConsole();
initializeValues();
initializeWidths();
initializeQuestions();
setUpEventListeners();
announceToScreenReader("Array visualizer loaded. Configure your array and function, then press Run.");
go();

// Screen reader announcement function
function announceToScreenReader(message) {
    const statusElement = document.getElementById('visualizationStatus');
    if (statusElement) {
        statusElement.textContent = message;
    }
}

function initializeConsole() {
    let oldLog = console.log;
    console.log = message => {
        const output = document.getElementById('consoleOutput');
        output.textContent += message + '\n';
        announceToScreenReader(`Console output: ${message}`);
        oldLog(message);
    };
}

function initializeValues() {
    document.getElementById('array').value = array;
    document.getElementById('valueFunction').value = valueFunction;
    document.getElementById('mode').value = mode;
}

function initializeWidths() {
    updateModeWidth();
}

function initializeQuestions() {
    let questions = document.getElementById('questions');
    removeAllChildNodes(questions);

    const selectedMode = document.getElementById('mode').value;
    const questionsForMode = questionAndAnswers[selectedMode] || [];
    
    questionsForMode.forEach((qAndA, index) => {
        let button = document.createElement('button');
        button.className = 'accordion';
        button.type = 'button';
        button.setAttribute('aria-expanded', 'false');
        button.setAttribute('aria-controls', `panel-${index}`);
        button.id = `accordion-${index}`;
        button.textContent = qAndA.q;
        questions.appendChild(button);

        let div = document.createElement('div');
        div.className = 'panel';
        div.id = `panel-${index}`;
        div.setAttribute('aria-labelledby', `accordion-${index}`);
        div.setAttribute('role', 'region');

        let p = document.createElement('p');
        p.innerHTML = qAndA.a;
        div.appendChild(p);

        questions.appendChild(div);
    });

    setupAccordionAccessibility();
}

function setupAccordionAccessibility() {
    const accordions = document.querySelectorAll('.accordion');
    
    accordions.forEach((accordion, index) => {
        accordion.addEventListener('click', handleAccordionClick);
        accordion.addEventListener('keydown', handleAccordionKeydown);
    });
}

function handleAccordionClick(event) {
    const accordion = event.currentTarget;
    const panel = accordion.nextElementSibling;
    const isExpanded = accordion.getAttribute('aria-expanded') === 'true';
    
    document.querySelectorAll('.accordion').forEach(acc => {
        if (acc !== accordion) {
            acc.setAttribute('aria-expanded', 'false');
            acc.classList.remove('active');
            acc.nextElementSibling.style.display = 'none';
        }
    });
    
    if (isExpanded) {
        accordion.setAttribute('aria-expanded', 'false');
        accordion.classList.remove('active');
        panel.style.display = 'none';
        announceToScreenReader(`Collapsed: ${accordion.textContent}`);
    } else {
        accordion.setAttribute('aria-expanded', 'true');
        accordion.classList.add('active');
        panel.style.display = 'block';
        announceToScreenReader(`Expanded: ${accordion.textContent}`);
    }
}

function handleAccordionKeydown(event) {
    const accordion = event.currentTarget;
    
    switch (event.key) {
        case 'Enter':
        case ' ':
            event.preventDefault();
            handleAccordionClick(event);
            break;
        case 'ArrowDown':
            event.preventDefault();
            focusNextAccordion(accordion);
            break;
        case 'ArrowUp':
            event.preventDefault();
            focusPreviousAccordion(accordion);
            break;
        case 'Home':
            event.preventDefault();
            focusFirstAccordion();
            break;
        case 'End':
            event.preventDefault();
            focusLastAccordion();
            break;
    }
}

function focusNextAccordion(currentAccordion) {
    const accordions = Array.from(document.querySelectorAll('.accordion'));
    const currentIndex = accordions.indexOf(currentAccordion);
    const nextIndex = (currentIndex + 1) % accordions.length;
    accordions[nextIndex].focus();
}

function focusPreviousAccordion(currentAccordion) {
    const accordions = Array.from(document.querySelectorAll('.accordion'));
    const currentIndex = accordions.indexOf(currentAccordion);
    const prevIndex = currentIndex === 0 ? accordions.length - 1 : currentIndex - 1;
    accordions[prevIndex].focus();
}

function focusFirstAccordion() {
    const firstAccordion = document.querySelector('.accordion');
    if (firstAccordion) firstAccordion.focus();
}

function focusLastAccordion() {
    const accordions = document.querySelectorAll('.accordion');
    if (accordions.length > 0) accordions[accordions.length - 1].focus();
}

function removeAllChildNodes(parent) {
    while (parent.firstChild) {
        parent.removeChild(parent.firstChild);
    }
}

function setUpEventListeners() {
    document.getElementById('controlForm').addEventListener('submit', go);
    
    const arrayInput = document.getElementById('array');
    const functionInput = document.getElementById('valueFunction');
    
    arrayInput.addEventListener('input', validateArrayInput);
    arrayInput.addEventListener('keydown', submitHandler);
    
    functionInput.addEventListener('input', validateFunctionInput);
    functionInput.addEventListener('keydown', submitHandler);
    
    document.getElementById('mode').addEventListener('change', handleModeChange);
    document.getElementById('copyButton').addEventListener('click', copyCodeToClipboard);
    document.getElementById('shareButton').addEventListener('click', copyURLToClipboard);
}

function validateArrayInput(event) {
    const input = event.target;
    const value = input.value.trim();
    
    try {
        if (value) {
            JSON.parse(value);
            input.setCustomValidity('');
            input.setAttribute('aria-invalid', 'false');
        }
    } catch (e) {
        input.setCustomValidity('Invalid JSON array format');
        input.setAttribute('aria-invalid', 'true');
    }
}

function validateFunctionInput(event) {
    const input = event.target;
    const value = input.value.trim();
    
    try {
        if (value) {
            new Function("return " + value)();
            input.setCustomValidity('');
            input.setAttribute('aria-invalid', 'false');
        }
    } catch (e) {
        input.setCustomValidity('Invalid function syntax');
        input.setAttribute('aria-invalid', 'true');
    }
}

function handleModeChange() {
    updateModeWidth();
    initializeQuestions();
    announceToScreenReader(`Mode changed to ${document.getElementById('mode').value}`);
}

function copyCodeToClipboard(event) {
    event.preventDefault();
    try {
        const arrayValue = document.getElementById('array').value;
        const functionValue = document.getElementById('valueFunction').value;
        const modeValue = document.getElementById('mode').value;
        
        let code = `let arr = ${arrayValue};\n`;
        code += `arr.${modeValue}(${functionValue});`;
        
        navigator.clipboard.writeText(code).then(() => {
            announceToScreenReader("Code copied to clipboard");
            const button = event.target;
            const originalText = button.textContent;
            button.textContent = '✓ Copied!';
            setTimeout(() => {
                button.textContent = originalText;
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy code:', err);
            announceToScreenReader("Failed to copy code");
        });
    } catch (error) {
        console.error('Error copying code:', error);
        announceToScreenReader("Error copying code");
    }
}

function copyURLToClipboard(event) {
    event.preventDefault();
    try {
        navigator.clipboard.writeText(buildURL()).then(() => {
            announceToScreenReader("URL copied to clipboard");
            const button = event.target;
            const originalText = button.textContent;
            button.textContent = '✓ Copied!';
            setTimeout(() => {
                button.textContent = originalText;
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy URL:', err);
            announceToScreenReader("Failed to copy URL");
        });
    } catch (error) {
        console.error('Error copying URL:', error);
        announceToScreenReader("Error copying URL");
    }
}

function submitHandler(event) {
    if(event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        go(event);
    }
}

function updateModeWidth() {
    const modeSelect = document.getElementById('mode');
    modeSelect.style.width = 'auto';
}

function buildURL() {
    const params = new URLSearchParams();
    params.append('array', document.getElementById('array').value);
    params.append('mode', document.getElementById('mode').value);
    params.append('valueFunction', document.getElementById('valueFunction').value);    
    return `${window.location.href.split('?')[0]}?${params.toString()}`;
}

function go(event) {
    if(event) event.preventDefault();
    
    const consoleOutput = document.getElementById('consoleOutput');
    consoleOutput.textContent = '';
    consoleOutput.classList.remove('error');
    
    const arrayInput = document.getElementById('array');
    const functionInput = document.getElementById('valueFunction');
    
    try {
        array = JSON.parse(arrayInput.value);
        if (!Array.isArray(array)) {
            throw new Error('Input must be a valid array');
        }
        arrayInput.setCustomValidity('');
        arrayInput.setAttribute('aria-invalid', 'false');
    } catch(e) {
        consoleOutput.className = 'error';
        consoleOutput.textContent = `Array Error: ${e.message}`;
        arrayInput.setCustomValidity(e.message);
        arrayInput.setAttribute('aria-invalid', 'true');
        announceToScreenReader(`Error: ${e.message}`);
        return;
    }
    
    config = configBuilder(array);

    try {
        valueFunction = new Function("return " + functionInput.value)();
        if (typeof valueFunction !== 'function') {
            throw new Error('Input must be a valid function');
        }
        functionInput.setCustomValidity('');
        functionInput.setAttribute('aria-invalid', 'false');
    } catch(e) {
        consoleOutput.className = 'error';
        consoleOutput.textContent = `Function Error: ${e.message}`;
        functionInput.setCustomValidity(e.message);
        functionInput.setAttribute('aria-invalid', 'true');
        announceToScreenReader(`Error: ${e.message}`);
        return;
    }

    mode = document.getElementById('mode').value;

    let visualization = document.getElementById('visualization');
    if(visualization) {
        visualization.remove();
    }
    
    announceToScreenReader(`Running ${mode} visualization with ${array.length} elements`);
    drawPanel(1);
    runAnimation(mode, 1);
}

function drawPanel(id) {
    const draw = SVG().id('visualization').addTo('#svgContainer').size(config.frameWidth, config.totalFrameHeight);
    
    draw.attr({
        'role': 'img',
        'aria-labelledby': 'viz-title',
        'aria-describedby': 'viz-description'
    });
    
    const drawer = new ArrayDrawer(draw, config);

    const frameGroup = draw.group().id(`frame${id}`);
    frameGroup.add(draw.rect(config.frameWidth, config.totalFrameHeight).fill(config.backgroundColor).attr({ rx: 10 }));

    frameGroup.add(draw.rect(config.arrayPanelWidth, config.totalFrameHeight).fill('#e3f2fd').attr({ x: 0, y: 0, rx: 10, 'fill-opacity': 0.7 }));
    let originalArrayText = buildText(draw, 'Original Array');
    center(originalArrayText, config.arrayPanelWidth, config.infoFrameHeight, 0, config.totalFrameHeight - config.infoFrameHeight);
    frameGroup.add(originalArrayText);
    frameGroup.add(drawer.buildArrayGroup(array, `staticArray${id}`));
    
    frameGroup.add(draw.rect(config.arrayPanelWidth, config.totalFrameHeight).fill('#e8f5e8').attr({ x: config.frameWidth - config.arrayPanelWidth, y: 0, rx: 10, 'fill-opacity': 0.7 }));
    let newArrayText = buildText(draw, 'Output');
    center(newArrayText, config.arrayPanelWidth, config.infoFrameHeight, config.frameWidth - config.arrayPanelWidth, config.totalFrameHeight - config.infoFrameHeight);
    frameGroup.add(newArrayText);
    frameGroup.add(drawer.buildArrayGroup(array, `movingArray${id}`, 0));

    frameGroup.add(draw.line(0, config.arrayFrameHeight, config.frameWidth, config.arrayFrameHeight).stroke({ width: 2, color: '#dee2e6' }));

    frameGroup.add(draw.rect(config.infoBoxWidth * 0.20, config.infoBoxHeight).fill('#fff3cd').attr({ 
        x: config.arrayPanelWidth + config.bezelWidth, 
        y: config.arrayFrameHeight + config.bezelWidth, 
        rx: 10, 
        stroke: '#ffc107', 
        'stroke-width': 2,
        'fill-opacity': 0.9 
    }));
    let method = buildFunctionText(draw, mode)
    center(method, config.infoBoxWidth * 0.20, config.infoBoxHeight, config.arrayPanelWidth + config.bezelWidth, config.arrayFrameHeight + config.bezelWidth);
    frameGroup.add(method);
    
    frameGroup.add(draw.rect(config.infoBoxWidth * 0.75, config.infoBoxHeight).fill('#fff3cd').attr({ 
        x: config.arrayPanelWidth + config.bezelWidth + config.infoBoxWidth * 0.25, 
        y: config.arrayFrameHeight + config.bezelWidth, 
        rx: 10, 
        stroke: '#ffc107',
        'stroke-width': 2, 
        'fill-opacity': 0.9 
    }));
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
    return draw.text(value).font({ 
        family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', 
        size: config.elementFontSize,
        weight: 600
    }).fill('#212529');
}

function buildFunctionText(draw, value) {
    let valueToShow = JSON.stringify(value, (_, val) => val + '');
    valueToShow = valueToShow.slice(1, valueToShow.length - 1);
    return draw.text(valueToShow)
        .fill('#212529')
        .attr({ 
            style: 'white-space: pre', 
            'font-family': '"SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, monospace', 
            'font-size': config.elementFontSize, 
            'font-weight': '500', 
            'letter-spacing': '0em',
        });
}

async function runAnimation(mode, id) {
    announceToScreenReader(`Starting ${mode} animation`);
    
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
    
    announceToScreenReader(`${mode} animation completed`);
}

async function executeMap(id) {
    let movingArray = SVG(document.getElementById(`movingArray${id}`));
    announceToScreenReader(`Mapping ${array.length} elements`);
    
    for(let [index, element] of movingArray.children().entries()) {
        await moveHalfway(element, config);
        updateElementColor(element, config.mappedArrayColor);
        
        let newValue = runWithErrorHandling(() => valueFunction(array[index], index, array));
        updateElementText(element, newValue);
        
        element.opacity(1);
        await moveToEnd(element, config)
        
        if (index < 3 || index === array.length - 1) {
            announceToScreenReader(`Mapped element ${index + 1}: ${array[index]} became ${newValue}`);
        }
    }
}

async function executeFilter(id) {
    let movingArray = SVG(document.getElementById(`movingArray${id}`));
    let filteredElements = 0;
    announceToScreenReader(`Filtering ${array.length} elements`);
    
    for(let [index, element] of movingArray.children().entries()) {
        await moveHalfway(element, config);

        const shouldKeep = runWithErrorHandling(() => valueFunction(array[index], index, array));
        if(shouldKeep) {
            updateElementColor(element, config.mappedArrayColor);
            updateElementIndex(element, filteredElements);
            element.opacity(1);

            await moveToEnd(element, config, -((index - filteredElements) * (config.elementSize + config.elementSpacing)));
            filteredElements++;
            announceToScreenReader(`Element ${array[index]} kept in filtered array`);
        } else {
            updateElementColor(element, config.filteredOutColor);
            announceToScreenReader(`Element ${array[index]} filtered out`);
        }
    }
    
    announceToScreenReader(`Filter completed: ${filteredElements} elements kept out of ${array.length}`);
}

async function executeForEach(id) {
    let movingArray = SVG(document.getElementById(`movingArray${id}`));
    announceToScreenReader(`Executing forEach on ${array.length} elements`);
    
    for(let [index, element] of movingArray.children().entries()) {
        await moveHalfway(element, config);

        runWithErrorHandling(() => valueFunction(array[index], index, array));
        updateElementColor(element, config.mappedArrayColor);
        updateElementIndex(element, index);
        
        announceToScreenReader(`Processed element ${index + 1}: ${array[index]}`);
    }
}

async function executeFind(id) {
    let movingArray = SVG(document.getElementById(`movingArray${id}`));
    announceToScreenReader(`Finding first matching element in ${array.length} elements`);
    
    for(let [index, element] of movingArray.children().entries()) {
        await moveHalfway(element, config);

        let currentValue = array[index];
        if(runWithErrorHandling(() => valueFunction(currentValue))) {
            updateElementColor(element, config.mappedArrayColor);
            convertArrayElementToValue(element);
            element.opacity(1);

            let distFromTop = (((array.length + 1) / 2) - 1) * (config.elementSize + config.elementSpacing) + (config.elementSize * 0.35 / 2);
            await moveToEnd(element, config, -(index * (config.elementSize + config.elementSpacing)) + distFromTop);
            announceToScreenReader(`Found matching element: ${currentValue} at index ${index}`);
            return;
        } else {
            updateElementColor(element, config.filteredOutColor);
        }
    }
    announceToScreenReader("No matching element found");
}

async function executeFindIndex(id) {
    let movingArray = SVG(document.getElementById(`movingArray${id}`));
    announceToScreenReader(`Finding index of first matching element in ${array.length} elements`);
    
    for(let [index, element] of movingArray.children().entries()) {
        await moveHalfway(element, config);

        let currentValue = array[index];
        if(runWithErrorHandling(() => valueFunction(currentValue))) {
            updateElementColor(element, config.mappedArrayColor);
            convertArrayIndexToValue(element);
            element.opacity(1);

            let distFromTop = (((array.length + 1) / 2) - 1) * (config.elementSize + config.elementSpacing) - (config.elementSize * 0.35 / 2);
            await moveToEnd(element, config, -(index * (config.elementSize + config.elementSpacing)) + distFromTop);
            announceToScreenReader(`Found matching element at index: ${index}`);
            return;
        } else {
            updateElementColor(element, config.filteredOutColor);
        }
    }
    announceToScreenReader("No matching element found, returning -1");
}

async function executeFindLast(id) {
    let movingArray = SVG(document.getElementById(`movingArray${id}`));
    announceToScreenReader(`Finding last matching element in ${array.length} elements`);
    
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
            announceToScreenReader(`Found last matching element: ${currentValue} at index ${index}`);
            return;
        } else {
            updateElementColor(element, config.filteredOutColor);
        }
    }
    announceToScreenReader("No matching element found");
}

async function executeFindLastIndex(id) {
    let movingArray = SVG(document.getElementById(`movingArray${id}`));
    announceToScreenReader(`Finding index of last matching element in ${array.length} elements`);
    
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
            announceToScreenReader(`Found last matching element at index: ${index}`);
            return;
        } else {
            updateElementColor(element, config.filteredOutColor);
        }
    }
    announceToScreenReader("No matching element found, returning -1");
}

function runWithErrorHandling(f) {
    try {
        return f();
    } catch(e) {
        const consoleOutput = document.getElementById('consoleOutput');
        consoleOutput.className = 'error';
        consoleOutput.textContent = e.message;
        announceToScreenReader(`Runtime error: ${e.message}`);
        throw e;
    }
}