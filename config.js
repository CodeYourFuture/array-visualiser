export const configBuilder = array => {
    let config = {
        frameWidth: document.body.clientWidth * 0.70,
    
        backgroundColor: '#90A4AE',
        arrayColor: '#4DD0E1',
        mappedArrayColor: '#81C784',
        filteredOutColor: '#E57373',
    };

    config.bezelWidth = config.frameWidth / 48,
    config.elementSize = config.frameWidth / 8,
    config.elementSpacing = config.frameWidth / 100,
    config.infoBoxHeight = config.frameWidth / 24,
    config.elementFontSize = config.frameWidth / 50,

    config.arrayFrameHeight = (config.bezelWidth * 2) + (array.length * config.elementSize) + ((array.length - 1) * config.elementSpacing);
    config.endPosition = config.frameWidth - config.elementSize - (config.bezelWidth * 2);
    config.halfwayPosition = ((config.endPosition - config.bezelWidth) / 2);
    config.totalFrameHeight = config.arrayFrameHeight + config.infoBoxHeight + (2 * config.bezelWidth);
    config.arrayPanelWidth = config.bezelWidth * 2 + config.elementSize;
    config.middleSectionWidth = config.frameWidth - (config.arrayPanelWidth * 2);
    config.infoBoxWidth = config.middleSectionWidth - (2 * config.bezelWidth);
    config.infoFrameHeight = config.infoBoxHeight + (2 * config.bezelWidth);

    return config;
};