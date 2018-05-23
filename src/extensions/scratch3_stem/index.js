const ArgumentType = require('../../extension-support/argument-type');
const BlockType = require('../../extension-support/block-type');
import Sounds from './Sounds'

class Scratch3StemBlocks {
    getInfo () {
        return {
            id: 'stem',
            name: 'Stem',
            blocks: [
                {
                    opcode: 'stemSpeaker',
                    blockType: BlockType.COMMAND,
                    text: '说 [TEXT]',
                    arguments: {
                        TEXT: {
                            type: ArgumentType.STRING,
                            defaultValue: '你好世界！'
                        }
                    }
                }
            ]
        };
    }
    stemSpeaker (args) {
        Sounds.getSingleton().playURL("/speech/tts/"+args.TEXT+"/demo.wav");
    }
}

module.exports = Scratch3StemBlocks;