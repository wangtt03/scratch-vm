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
                    text: 'say [TEXT]',
                    arguments: {
                        TEXT: {
                            type: ArgumentType.STRING,
                            defaultValue: '你好！'
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