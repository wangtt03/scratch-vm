const ArgumentType = require('../../extension-support/argument-type');
const BlockType = require('../../extension-support/block-type');
const Runtime = require('../../engine/runtime');
const Cast = require('../../util/cast');
const Video = require('../../io/video');
import Sounds from './Sounds'
import _ from 'lodash';

const VideoState = {
    /** Video turned off. */
    OFF: '关闭',

    /** Video turned on with default y axis mirroring. */
    ON: '打开',

    /** Video turned on without default y axis mirroring. */
    ON_FLIPPED: '镜像打开'
};

const TextToAudioState = {
    Female: '成年女性',
    Male: '成年男性',
    Girl: '女孩',
    Boy: '男孩',
};

const EmotionTypeState = {
    Anger:"愤怒",
    Disgust:"厌恶",
    Fear:"恐惧",
    Happiness:"高兴",
    Neutral:"平静",
    Sadness:"伤心",
    Surprise:"惊讶",
};

const SrLangTypeState = {
    Putonghua: '普通话',
    English: '英语',
    Yue:"粤语",
    Sichuan:"四川话"
};

let assetData = {};
try {
    assetData = require('./manifest');
} catch (e) {
    // Non-webpack environment, don't worry about assets.
}

const menuIcon = "data:image/png;base64,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";

const iconURI = "data:image/png;base64,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";

class Scratch3StemBlocks {
    constructor (runtime) {
        this.runtime = runtime;

        this.dataBuffer = [];
        this.throttleTime = 1500;

        this._speechPromises = [];
        this._currentUtterance = '';
        this._currentEmotion = '';
        this._currentModelPredict = '';
        this._currentOcrResult = '';
        this._currentGeneralImagePredict = '';

        this._processAudioCallback = this._processAudioCallback.bind(this);
        this._resetListening = this._resetListening.bind(this);
        this._stopTranscription = this._stopTranscription.bind(this);

        this.runtime.on('PROJECT_STOP_ALL', this._stopAIContext.bind(this));

        this._loadUISounds();
    }

    _stopAIContext() {
        this._resetListening();
        this.runtime.ioDevices.video.disableVideo();        
        this.dataBuffer = [];
        this._speechPromises = [];
        this._currentUtterance = '';
        this._currentEmotion = '';
        this._currentModelPredict = '';
        this._currentOcrResult = '';
        this._currentGeneralImagePredict = '';
    }

    getInfo () {
        return {
            id: 'stem',
            name: '人工智能',
            menuIconURI: menuIcon,
            blockIconURI: iconURI,
            blocks: [
                {
                    opcode: 'videoToggle',
                    text: "[VIDEO_STATE] 摄像头",
                    arguments: {
                        VIDEO_STATE: {
                            type: ArgumentType.NUMBER,
                            menu: 'VIDEO_STATE',
                            defaultValue: VideoState.ON
                        }
                    }
                },
                {
                    opcode: 'setVideoTransparency',
                    text: "设置视频透明度 [TRANSPARENCY]",
                    arguments: {
                        TRANSPARENCY: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 50
                        }
                    }
                },
                {
                    opcode: 'stemSpeaker',
                    blockType: BlockType.COMMAND,
                    text: '使用 [AUDIO_GENDER] 语音合成 [TEXT]',
                    arguments: {
                        TEXT: {
                            type: ArgumentType.STRING,
                            defaultValue: '你好！'
                        },
                        AUDIO_GENDER: {
                            type: ArgumentType.NUMBER,
                            menu: 'AUDIO_GENDER',
                            defaultValue: TextToAudioState.Female
                        }
                    }
                },
                {
                    opcode: 'listenAndWait',
                    text: '开始语音识别 [LANG_TYPE] 持续 [SR_DURATION]',
                    blockType: BlockType.COMMAND,
                    arguments: {
                        SR_DURATION: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 5
                        },
                        LANG_TYPE: {
                            type: ArgumentType.NUMBER,
                            menu: 'LANG_TYPE',
                            defaultValue: SrLangTypeState.Putonghua
                        }
                    }
                },
                {
                    opcode: 'getSpeech',
                    text: '获取语音识别结果',
                    blockType: BlockType.REPORTER
                },
                {
                    opcode: 'whenSoundRecognizedHat',
                    text: '当在语音中检测到 [PHRASE] 时',
                    blockType: BlockType.HAT,
                    arguments: {
                        PHRASE: {
                            type: ArgumentType.STRING,
                            defaultValue: '熊猫'
                        }
                    }
                },
                {
                    opcode: 'imageRecognizer',
                    blockType: BlockType.COMMAND,
                    text: '使用模型 [TEXT] 识别视频图像',
                    arguments: {
                        TEXT: {
                            type: ArgumentType.STRING,
                            defaultValue: '00000'
                        }
                    }
                },
                {
                    opcode: 'imageRecognizerByUrl',
                    blockType: BlockType.COMMAND,
                    text: '使用模型 [TEXT] 识别网络图像 [IMG_URL]',
                    arguments: {
                        TEXT: {
                            type: ArgumentType.STRING,
                            defaultValue: '00000'
                        },
                        IMG_URL: {
                            type: ArgumentType.STRING,
                            defaultValue: '图片地址'
                        }
                    }
                },
                {
                    opcode: 'getImageRecognizer',
                    text: '获取模型识别结果',
                    blockType: BlockType.REPORTER
                },
                {
                    opcode: 'emotionRecognizer',
                    blockType: BlockType.COMMAND,
                    text: '检测视频人脸表情',
                },
                {
                    opcode: 'getEmotion',
                    text: '获取人脸表情识别结果',
                    blockType: BlockType.REPORTER
                },
                {
                    opcode: 'whenEmotionHat',
                    text: '当表情为 [EMOTION_TYPE]',
                    blockType: BlockType.HAT,
                    arguments: {
                        EMOTION_TYPE: {
                            type: ArgumentType.NUMBER,
                            menu: 'EMOTION_TYPE',
                            defaultValue: EmotionTypeState.Neutral
                        }
                    }
                },
                {
                    opcode: 'imageGeneralRecognizer',
                    blockType: BlockType.COMMAND,
                    text: '使用通用模型识别视频图像',
                },
                {
                    opcode: 'imageGeneralRecognizerByUrl',
                    blockType: BlockType.COMMAND,
                    text: '使用通用模型识别网络图像 [IMG_URL]',
                    arguments: {
                        IMG_URL: {
                            type: ArgumentType.STRING,
                            defaultValue: '图片地址'
                        }
                    }
                },
                {
                    opcode: 'getImageGeneralRecognizer',
                    text: '获取通用模型图像识别结果',
                    blockType: BlockType.REPORTER
                },
                {
                    opcode: 'whenImageRecognizedHat',
                    text: '当在图像中检测到 [PHRASE] 时',
                    blockType: BlockType.HAT,
                    arguments: {
                        PHRASE: {
                            type: ArgumentType.STRING,
                            defaultValue: '熊猫'
                        }
                    }
                },
                {
                    opcode: 'textGeneralRecognizer',
                    blockType: BlockType.COMMAND,
                    text: '识别视频中的文字'
                },
                {
                    opcode: 'textGeneralRecognizerByUrl',
                    blockType: BlockType.COMMAND,
                    text: '识别图片中的文字 [IMG_URL]',
                    arguments: {
                        IMG_URL: {
                            type: ArgumentType.STRING,
                            defaultValue: '图片地址'
                        }
                    }
                },
                {
                    opcode: 'getTextGeneralRecognizer',
                    text: '获取图像文字识别结果',
                    blockType: BlockType.REPORTER
                }
            ],
            menus: {
                AUDIO_GENDER: this._buildMenu(this.AUDIO_GENDER_INFO),
                VIDEO_STATE: this._buildMenu(this.VIDEO_STATE_INFO),
                LANG_TYPE: this._buildMenu(this.LANG_TYPE_INFO),
                EMOTION_TYPE: this._buildMenu(this.EMOTION_TYPE_INFO)
            }

        };
    }

    get VIDEO_STATE_INFO () {
        return [
            {
                name: "关闭",
                value: VideoState.OFF
            },
            {
                name: "打开",
                value: VideoState.ON
            },
            {
                name: "镜像打开",
                value: VideoState.ON_FLIPPED
            }
        ];
    }

    get EMOTION_TYPE_INFO() {
        return [
            {
                name: "愤怒",
                value: EmotionTypeState.Anger
            },
            {
                name: "厌恶",
                value: EmotionTypeState.Disgust
            },
            {
                name: "恐惧",
                value: EmotionTypeState.Fear
            },
            {
                name: "高兴",
                value: EmotionTypeState.Happiness
            },
            {
                name: "平静",
                value: EmotionTypeState.Neutral
            },
            {
                name: "伤心",
                value: EmotionTypeState.Sadness
            },
            {
                name: "惊讶",
                value: EmotionTypeState.Surprise
            },
        ];
    }

    get LANG_TYPE_INFO () {
        return [
            {
                name: "普通话",
                value: SrLangTypeState.Putonghua
            },
            {
                name: "英语",
                value: SrLangTypeState.English
            },
            {
                name: "粤语",
                value: SrLangTypeState.Yue
            },
            {
                name: "四川话",
                value: SrLangTypeState.Sichuan
            }
        ];
    }

    get AUDIO_GENDER_INFO () {
        return [
            {
                name: "成年男性",
                value: TextToAudioState.Male
            },
            {
                name: "成年女性",
                value: TextToAudioState.Female
            },
            {
                name: "男孩",
                value: TextToAudioState.Boy
            },
            {
                name: "女孩",
                value: TextToAudioState.Girl
            },
        ];
    }

    _buildMenu (info) {
        return info.map((entry, index) => {
            const obj = {};
            obj.text = entry.name;
            obj.value = entry.value || String(index + 1);
            return obj;
        });
    }

    videoToggle (args) {
        const state = args.VIDEO_STATE;
        this.globalVideoState = state;
        if (state === VideoState.OFF) {
            this.runtime.ioDevices.video.disableVideo();
        } else {
            this.runtime.ioDevices.video.enableVideo();
            // Mirror if state is ON. Do not mirror if state is ON_FLIPPED.
            this.runtime.ioDevices.video.mirror = state === VideoState.ON;
        }
    }

    setVideoTransparency (args) {
        const transparency = Cast.toNumber(args.TRANSPARENCY);
        this.globalVideoTransparency = transparency;
        this.runtime.ioDevices.video.setPreviewGhost(transparency);
    }

    getSpeech () {
        return this._currentUtterance;
    }

    whenSoundRecognizedHat(args) {
        return this._currentUtterance.indexOf(args.PHRASE) != -1;
    }

    getEmotion () {
        return this._currentEmotion;
    }

    whenEmotionHat (args) {
        return args.EMOTION_TYPE == this._currentEmotion;
    }

    _translateEmotion(emotion) {
        if (emotion == "anger") {
            return EmotionTypeState.Anger;
        }
        if (emotion == "disgust") {
            return EmotionTypeState.Disgust;
        }
        if (emotion == "fear") {
            return EmotionTypeState.Fear;
        }
        if (emotion == "happiness") {
            return EmotionTypeState.Happiness;
        }
        if (emotion == "neutral") {
            return EmotionTypeState.Neutral;
        }
        if (emotion == "sadness") {
            return EmotionTypeState.Sadness;
        }
        if (emotion == "surprise") {
            return EmotionTypeState.Surprise;
        }
    }

    listenAndWait (args) {
        this.srDuration = args.SR_DURATION;
        if (this.srDuration > 10) {
            this.srDuration = 10;
        }
        this.langCode = 1537;
        if (args.LANG_TYPE == SrLangTypeState.English) {
            this.langCode = 1737;
        } else if (args.LANG_TYPE == SrLangTypeState.Yue) {
            this.langCode = 1637;
        } else if (args.LANG_TYPE == SrLangTypeState.Sichuan) {
            this.langCode = 1837;
        }

        // this._phraseList = this._scanBlocksForPhraseList();
        // this._utteranceForEdgeTrigger = '';
        return this._playSound(this._startSoundBuffer).then(() => {
                const speechPromise = new Promise(resolve => {
                    const listeningInProgress = this._speechPromises.length > 0;
                    this._speechPromises.push(resolve);
                    if (!listeningInProgress) {
                        this._startListening();
                    }
                });
                return speechPromise.then(() => this._playSound(this._endSoundBuffer));
            });
    }

    _loadUISounds () {
        const startSoundBuffer = assetData['speech-rec-start.mp3'];
        this._decodeSound(startSoundBuffer).then(buffer => {
            this._startSoundBuffer = buffer;
        });

        const endSoundBuffer = assetData['speech-rec-end.mp3'];
        this._decodeSound(endSoundBuffer).then(buffer => {
            this._endSoundBuffer = buffer;
        });
    }

    _decodeSound (soundBuffer) {
        const context = this.runtime.audioEngine && this.runtime.audioEngine.audioContext;

        if (!context) {
            return Promise.reject(new Error('No Audio Context Detected'));
        }

        // Check for newer promise-based API
        if (context.decodeAudioData.length === 1) {
            return context.decodeAudioData(soundBuffer);
        } else { // eslint-disable-line no-else-return
            // Fall back to callback API
            return new Promise((resolve, reject) =>
                context.decodeAudioData(soundBuffer,
                    buffer => resolve(buffer),
                    error => reject(error)
                )
            );
        }
    }

    _playSound (buffer) {
        if (this.runtime.audioEngine === null) return;
        const context = this.runtime.audioEngine.audioContext;
        const bufferSource = context.createBufferSource();
        bufferSource.buffer = buffer;
        bufferSource.connect(this.runtime.audioEngine.audioContext.destination);
        bufferSource.start();
        return new Promise(resolve => {
            bufferSource.onended = () => {
                resolve();
            };
        });
    }

    _resolveSpeechPromises () {
        for (let i = 0; i < this._speechPromises.length; i++) {
            const resFn = this._speechPromises[i];
            resFn();
        }
        this._speechPromises = [];
    }

    _startListening () {
        // If we've already setup the context, we can resume instead of doing all the setup again.
        if (this._context) {
            this._resumeListening();
        } else {
            this._initListening();
        }
        // Force the block to timeout if we don't get any results back/the user didn't say anything.
        this._speechTimeoutId = setTimeout(this._stopTranscription, this.srDuration * 1000);
    }

    _initListening () {
        this._initializeMicrophone();
        this._initScriptNode();

        Promise.all([this._audioPromise]).then((values)=>{
            this._micStream = values[0];
            this._startByteStream();
        }).catch(e => {
            log.error(`Problem with setup:  ${e}`);
        });
    }

    _startByteStream () {
        // Hook up the scriptNode to the mic
        this._sourceNode = this._context.createMediaStreamSource(this._micStream);
        this._sourceNode.connect(this._scriptNode);
        this._scriptNode.addEventListener('audioprocess', this._processAudioCallback);
        this._scriptNode.connect(this._context.destination);
    }

    _processAudioCallback (e) {
        const floatSamples = Float32Array.from(e.inputBuffer.getChannelData(0));
        this.dataBuffer.push(this._interpolateArray(floatSamples, 8000, 44100));
    }

    _interpolateArray(data, newSampleRate, oldSampleRate) {
        var fitCount = Math.round(data.length * (newSampleRate / oldSampleRate));
        //var newData = new Array();
        var newData = [];
        //var springFactor = new Number((data.length - 1) / (fitCount - 1));
        var springFactor = Number((data.length - 1) / (fitCount - 1));
        newData[0] = data[0]; // for new allocation
        for (var i = 1; i < fitCount - 1; i++) {
            var tmp = i * springFactor;
            //var before = new Number(Math.floor(tmp)).toFixed();
            //var after = new Number(Math.ceil(tmp)).toFixed();
            var before = Number(Math.floor(tmp)).toFixed();
            var after = Number(Math.ceil(tmp)).toFixed();
            var atPoint = tmp - before;
            newData[i] = this._linearInterpolate(data[before], data[after], atPoint);
        }
        newData[fitCount - 1] = data[data.length - 1]; // for new allocation
        return newData;
    }

    _linearInterpolate(before, after, atPoint) {
        return before + (after - before) * atPoint;
    }

    _initScriptNode () {
        // Create a node that sends raw bytes across the websocket
        this._scriptNode = this._context.createScriptProcessor(4096, 1, 1);
    }

    _initializeMicrophone () {
        // Safari still needs a webkit prefix for audio context
        this._context = new (window.AudioContext || window.webkitAudioContext)();
        this._audioPromise = navigator.mediaDevices.getUserMedia({
            audio: {
                echoCancellation: true,
                channelCount: 1,
                sampleRate: {
                    ideal: 44100
                },
                sampleSize: 16
            }
        });

        this._audioPromise.then(() => {
        }).catch(e => {
            log.error(`Problem connecting to microphone:  ${e}`);
        });
    }

    _resumeListening () {
        this._clearAudioBuffer();
        this._context.resume.bind(this._context);
        Promise.all([this._audioPromise]).then((values)=>{
            this._micStream = values[0];
            this._startByteStream();
        }).catch(e => {
            console.log(`Problem with setup:  ${e}`);
        });
    }

    _clearAudioBuffer() {
        this.dataBuffer = [];
    }

    _resetListening () {
        this._stopListening();
        // this._closeWebsocket();
        this._resolveSpeechPromises();
        this._clearAudioBuffer();
    }

    _stopTranscription () {
        this._stopListening();

        var len = 0;
        for (var i = 0; i < this.dataBuffer.length; i++){
            len += this.dataBuffer[i].length;
        }
        var interleaved = new Float32Array(len);
        var offset = 0;
        for (var i = 0; i < this.dataBuffer.length; i++){
            interleaved.set(this.dataBuffer[i], offset);
            offset += this.dataBuffer[i].length;
        }

        var output = new Int16Array(interleaved.length);
        for (var i = 0; i < interleaved.length; i++){
            var s = Math.max(-1, Math.min(1, interleaved[i]));
            output[i] = (s < 0 ? s * 0x8000 : s * 0x7FFF);
        }
        
        const uploadPromise = new Promise(rev => {
            let xhr = new XMLHttpRequest();
            xhr.onreadystatechange = function () {
                if (xhr.readyState == 4) {
                    if (xhr.status == 200) {
                        let res = JSON.parse(xhr.responseText);
                        if (!!res.result && res.result.length > 0) {
                            this._currentUtterance = res.result[0];
                            rev(this._currentUtterance);
                        }
                    } else {
                        rev("");
                    }
                }
            };
            xhr.open('POST', '/speech/sr/' + this.langCode, true);
            xhr.setRequestHeader("Content-Type", "audio/pcm;rate=8000")
            xhr.send(output);
            this._resetListening();
            // this._speechFinalResponseTimeout = setTimeout(this._resetListening, 3000);
        });

        uploadPromise.then((result)=>{
            this._currentUtterance = result;
        });
    }

    _stopListening () {
        // Note that this can be called before any Listen And Wait block did setup,
        // so check that things exist before disconnecting them.
        if (this._context) {
            this._context.suspend.bind(this._context);
        }
        // This is called on green flag to reset things that may never have existed
        // in the first place. Do a bunch of checks.
        if (this._scriptNode) {
            this._scriptNode.removeEventListener('audioprocess', this._processAudioCallback);
            this._scriptNode.disconnect();
        }
        if (this._sourceNode) {
            this._sourceNode.disconnect();
        }

    }
    
    stemSpeaker (args) {
        var gender = args.AUDIO_GENDER;
        if (gender == TextToAudioState.Male) {
            gender = 1;
        } else if (gender == TextToAudioState.Female){
            gender = 0;
        }  else if (gender == TextToAudioState.Boy){
            gender = 3;
        } else if (gender == TextToAudioState.Girl){
            gender = 4;
        } else {
            gender = 0;
        }

        return new Promise(resolve => {
            resolve();
        }).then(() => {
            const playSoundPromise = new Promise(rev => {
                let xhr = new XMLHttpRequest();
                xhr.onreadystatechange = function () {
                    if (xhr.readyState == 4) {
                        if (xhr.status == 200) {
                            let res = JSON.parse(xhr.responseText);
                            Sounds.getSingleton().playURL("https://tsn.baidu.com/text2audio?tex="+args.TEXT+"&tok="+res["access_token"]+"&spd=5&pit=5&vol=15&per="+gender+"&cuid=24.8e3b7a22de8dad3b796edd9a56463eca.2592000.1530540031.282335-11340832&ctp=1&lan=zh&atype=.mp3", {onEnded: function(){
                                rev();
                            }});
                        } else {
                            rev();
                        }
                    }
                };
                xhr.open('GET', '/speech/baidutoken', true);
                xhr.send();
            });

            return playSoundPromise.then(()=>{});
        });

    }

    imageRecognizerByUrl(args) {
        const loadPromise = new Promise(resolve1 => {
            var xhr = new XMLHttpRequest();
            xhr.onload = function() {
              var reader = new FileReader();
              reader.onloadend = function() {
                resolve1(reader.result);
              }
              reader.readAsDataURL(xhr.response);
            };
            xhr.open('GET', "/media?u=" + encodeURIComponent(args.IMG_URL));
            xhr.responseType = 'blob';
            xhr.send();
        });

        return loadPromise.then((dataurl) => {
            let arr = dataurl.split(','), 
            mime = arr[0].match(/:(.*?);/)[1],
            bstr = atob(arr[1]), 
            n = bstr.length, 
            u8arr = new Uint8Array(n);
            while(n--){
                u8arr[n] = bstr.charCodeAt(n);
            }
            let blob = new Blob([u8arr], {type:mime});
            console.log(URL.createObjectURL(blob));

            let postData = new FormData();
            postData.append('fileData', blob);
            postData.append('baseModel', "mobilenet_0.50_224_image_classification");
            postData.append('versionID', args.TEXT);
            postData.append('versionName', '动物分类');

            return new Promise(rev => {
                let xhr = new XMLHttpRequest();
                xhr.onreadystatechange = function () {
                    if (xhr.readyState == 4) {
                        if (xhr.status == 200) {
                            let res = JSON.parse(xhr.responseText);
                            res = res.sort(function(a,b){
                                if (a.score > b.score) return -1;
                                return 1;
                            });
                            rev(res[0].class);
                        } else {
                            rev("error");
                        }
                    }
                };
                xhr.open('POST', '/stemgarden/stemgarden/1.0/ai/tensorflow/predictFromFile', true);
                xhr.send(postData);
            }).then(res => {
                this._currentModelPredict = res;
            });
        });
    }

    imageRecognizer (args) {
        const canvas = this.runtime.ioDevices.video.getFrame({
            format: Video.FORMAT_CANVAS,
            dimensions: [480, 360]
        }); 
        
        if (!canvas) {
            this._currentModelPredict = "error";
            return;
        }

        let dataurl = canvas.toDataURL('image/png');
        let arr = dataurl.split(','), 
            mime = arr[0].match(/:(.*?);/)[1],
            bstr = atob(arr[1]), 
            n = bstr.length, 
            u8arr = new Uint8Array(n);
        while(n--){
            u8arr[n] = bstr.charCodeAt(n);
        }
        let blob = new Blob([u8arr], {type:mime});
        console.log(URL.createObjectURL(blob));

        let postData = new FormData();
        postData.append('fileData', blob);
        postData.append('baseModel', "mobilenet_0.50_224_image_classification");
        postData.append('versionID', args.TEXT);
        postData.append('versionName', '动物分类');

        const modelPromise = new Promise(rev => {
            let xhr = new XMLHttpRequest();
            xhr.onreadystatechange = function () {
                if (xhr.readyState == 4) {
                    if (xhr.status == 200) {
                        let res = JSON.parse(xhr.responseText);
                        res = res.sort(function(a,b){
                            if (a.score > b.score) return -1;
                            return 1;
                        });
                        rev(res[0].class);
                    } else {
                        rev("error");
                    }
                }
            };
            xhr.open('POST', '/stemgarden/stemgarden/1.0/ai/tensorflow/predictFromFile', true);
            xhr.send(postData);
        });

        return modelPromise.then(res => {
            this._currentModelPredict = res;
        });
    }

    getImageRecognizer() {
        return this._currentModelPredict;
    }

    getTextGeneralRecognizer() {
        return this._currentOcrResult;
    }

    textGeneralRecognizerByUrl(args) {
        if (!this.textGeneralRecognizerByUrlThrottled) {
            this.textGeneralRecognizerByUrlThrottled = _.throttle(this.textGeneralRecognizerByUrlImpl, this.throttleTime, { 'trailing': false });
        }
        this.textGeneralRecognizerByUrlThrottled(args);
    }

    textGeneralRecognizerByUrlImpl (args) {
        const loadPromise = new Promise(resolve1 => {
            var xhr = new XMLHttpRequest();
            xhr.onload = function() {
              var reader = new FileReader();
              reader.onloadend = function() {
                resolve1(reader.result);
              }
              reader.readAsDataURL(xhr.response);
            };
            xhr.open('GET', "/media?u=" + encodeURIComponent(args.IMG_URL));
            xhr.responseType = 'blob';
            xhr.send();
        });

        return Promise.all([loadPromise]).then((values) => {
            var dataurl = values[0];
            let arr = dataurl.split(',');

            return new Promise(rev => {
                let xhr = new XMLHttpRequest();
                xhr.onreadystatechange = function () {
                    if (xhr.readyState == 4) {
                        if (xhr.status == 200) {
                            let res = JSON.parse(xhr.responseText);
                            if (!!res.words_result && res.words_result.length > 0) {
                                // var words = [];
                                // for (let index = 0; index < res.words_result.length; index++) {
                                //     const element = res.words_result[index];
                                //     words.push(element.words);
                                // }
                                // return words;
                                rev(res.words_result[0].words);
                            }
                        } else {
                            rev("");
                        }
                    }
                };
                xhr.open('POST', '/speech/ocr', true);
                xhr.send(encodeURIComponent(arr[1]));
            });
            
        }).then(result => {
            this._currentOcrResult = result;
        });
    }

    textGeneralRecognizer() {
        if (!this.textGeneralRecognizerThrottled) {
            this.textGeneralRecognizerThrottled = _.throttle(this.textGeneralRecognizerImpl, this.throttleTime, { 'trailing': false });
        }
        this.textGeneralRecognizerThrottled();
    }

    textGeneralRecognizerImpl() {
        const canvas = this.runtime.ioDevices.video.getFrame({
            format: Video.FORMAT_CANVAS,
            dimensions: [480, 360],
        }); 

        if (!canvas) {
            this._currentOcrResult = "error";
            return;
        }
        let dataurl = canvas.toDataURL('image/jpeg',0.7);
        let arr = dataurl.split(',');

        const ocrPromise = new Promise(rev => {
            let xhr = new XMLHttpRequest();
            xhr.onreadystatechange = function () {
                if (xhr.readyState == 4) {
                    if (xhr.status == 200) {
                        let res = JSON.parse(xhr.responseText);
                        if (!!res.words_result && res.words_result.length > 0) {
                            // var words = [];
                            // for (let index = 0; index < res.words_result.length; index++) {
                            //     const element = res.words_result[index];
                            //     words.push(element.words);
                            // }
                            // return words;
                            rev(res.words_result[0].words);
                        }
                    } else {
                        rev("");
                    }
                }
            };
            xhr.open('POST', '/speech/ocr', true);
            xhr.send(encodeURIComponent(arr[1]));
        });

        return ocrPromise.then(result => {
            this._currentOcrResult = result;
        });
    }

    getImageGeneralRecognizer() {
        return this._currentGeneralImagePredict;
    }

    whenImageRecognizedHat (args) {
        return this._currentGeneralImagePredict.indexOf(args.PHRASE) != -1 || 
            this._currentModelPredict.indexOf(args.PHRASE) != -1 || 
            this._currentOcrResult.indexOf(args.PHRASE) != -1;
    }

    imageGeneralRecognizerByUrl(args) {
        if (!this.imageGeneralRecognizerByUrlThrottled) {
            this.imageGeneralRecognizerByUrlThrottled = _.throttle(this.imageGeneralRecognizerByUrlImpl, this.throttleTime, { 'trailing': false });
        }
        this.imageGeneralRecognizerByUrlThrottled(args);
    }

    imageGeneralRecognizerByUrlImpl(args) {
        const loadPromise = new Promise(resolve1 => {
            var xhr = new XMLHttpRequest();
            xhr.onload = function() {
              var reader = new FileReader();
              reader.onloadend = function() {
                resolve1(reader.result);
              }
              reader.readAsDataURL(xhr.response);
            };
            xhr.open('GET', "/media?u=" + encodeURIComponent(args.IMG_URL));
            xhr.responseType = 'blob';
            xhr.send();
        });

        const tokenPromise = new Promise(rev => {
            let xhr = new XMLHttpRequest();
            xhr.onreadystatechange = function () {
                if (xhr.readyState == 4) {
                    if (xhr.status == 200) {
                        let res = JSON.parse(xhr.responseText);
                        rev(res["access_token"]);
                    } else {
                        rev("");
                    }
                }
            };
            xhr.open('GET', '/speech/baiducetoken', true);
            xhr.send();
        });

        return Promise.all([loadPromise, tokenPromise]).then((values) => {
            var dataurl = values[0];
            var token = values[1];
            let arr = dataurl.split(',');

            return new Promise(recv => {
                let xhr2 = new XMLHttpRequest();
                xhr2.onreadystatechange = function () {
                    if (xhr2.readyState == 4) {
                        if (xhr2.status == 200) {
                            let res2 = JSON.parse(xhr2.responseText);
                            if (!!res2.result && res2.result.length > 0) {
                                recv(res2.result[0].root +"-"+res2.result[0].keyword);
                            }
                        } else {
                            recv("");
                        }
                    }
                };
                
                xhr2.open('POST', 'https://aip.baidubce.com/rest/2.0/image-classify/v2/advanced_general?access_token=' + token, true);
                xhr2.setRequestHeader("Content-Type", "application/x-www-form-urlencoded")
                xhr2.send("image=" + encodeURIComponent(arr[1]));
            });
        }).then(result => {
            this._currentGeneralImagePredict = result;
        });
    }

    imageGeneralRecognizer() {
        if (!this.imageGeneralRecognizerThrottled) {
            this.imageGeneralRecognizerThrottled = _.throttle(this.imageGeneralRecognizerImpl, this.throttleTime, { 'trailing': false });
        }
        this.imageGeneralRecognizerThrottled();
    }

    imageGeneralRecognizerImpl() {
        const canvas = this.runtime.ioDevices.video.getFrame({
            format: Video.FORMAT_CANVAS,
            dimensions: [480, 360]
        }); 

        if (!canvas) {
            this._currentGeneralImagePredict = "error";
            return;
        }

        let dataurl = canvas.toDataURL('image/jpeg',0.7);
        let arr = dataurl.split(',');

        const generalPromise = new Promise(rev => {
            let xhr = new XMLHttpRequest();
            xhr.onreadystatechange = function () {
                if (xhr.readyState == 4) {
                    if (xhr.status == 200) {
                        let res = JSON.parse(xhr.responseText);
                        rev(res["access_token"]);
                    } else {
                        rev("");
                    }
                }
            };
            xhr.open('GET', '/speech/baiducetoken', true);
            xhr.send();
        });

        return generalPromise.then((token) => {
            return new Promise(recv => {
                let xhr2 = new XMLHttpRequest();
                xhr2.onreadystatechange = function () {
                    if (xhr2.readyState == 4) {
                        if (xhr2.status == 200) {
                            let res2 = JSON.parse(xhr2.responseText);
                            if (!!res2.result && res2.result.length > 0) {
                                recv(res2.result[0].keyword);
                            }
                        } else {
                            recv("");
                        }
                    }
                };
                
                xhr2.open('POST', 'https://aip.baidubce.com/rest/2.0/image-classify/v2/advanced_general?access_token=' + token, true);
                xhr2.setRequestHeader("Content-Type", "application/x-www-form-urlencoded")
                xhr2.send("image=" + encodeURIComponent(arr[1]));
            }).then(result => {
                this._currentGeneralImagePredict = result;
            });
        });
    }

    emotionRecognizer() {
        if (!this.emotionRecognizerThrottled) {
            this.emotionRecognizerThrottled = _.throttle(this.emotionRecognizerImpl, this.throttleTime, { 'trailing': false });
        }
        this.emotionRecognizerThrottled();

    }

    emotionRecognizerImpl() {
        var that = this;
        const canvas = this.runtime.ioDevices.video.getFrame({
            format: Video.FORMAT_CANVAS,
            dimensions: [480, 360]
        }); 
        if (!canvas) {
            this._currentEmotion = 'error';
            return;
        }

        let dataurl = canvas.toDataURL('image/png');
        let arr = dataurl.split(',');

        let postData = new FormData();
        postData.append('api_key', "t-ooiFwZ5IgvmExWTcN7sbcDbha2v5VN");
        postData.append('api_secret', "MF2bFGQIPTc7mxg44xc_GWnhTq_f3eh8");
        postData.append('return_attributes', "emotion");
        postData.append("image_base64", arr[1]);

        const emotionPromise = new Promise(rev => {
            let xhr = new XMLHttpRequest();
            xhr.onreadystatechange = function () {
                if (xhr.readyState == 4) {
                    if (xhr.status == 200) {
                        let res = JSON.parse(xhr.responseText);
                        if (!!res.faces && res.faces.length > 0) {
                            var face = res.faces[0];
                            if (!!face.attributes && !!face.attributes.emotion) {
                                var maxScore = 0;
                                var currentEmotion = "";
                                for (var emotionItem in face.attributes.emotion) {
                                    if (face.attributes.emotion[emotionItem] > maxScore) {
                                        currentEmotion = emotionItem;
                                        maxScore = face.attributes.emotion[emotionItem];
                                    }
                                    
                                }
                                rev(currentEmotion);
                            }
                        }
                    } else {
                        rev("error");
                    }
                }
            };
            xhr.open('POST', 'https://api-cn.faceplusplus.com/facepp/v3/detect', true);
            xhr.send(postData);
        });

        return emotionPromise.then((res) => {
            that._currentEmotion = this._translateEmotion(res);
        });
    }
};

module.exports = Scratch3StemBlocks;