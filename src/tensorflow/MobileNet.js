import * as tf from '@tensorflow/tfjs';

// import {IMAGENET_CLASSES} from './imagenet_classes';

// const MOBILENET_MODEL_PATH =
//     // tslint:disable-next-line:max-line-length
//     'https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v1_0.25_224/model.json';
// const MODEL_URL = 'https://s3-us-west-1.amazonaws.com/theturkeyapp/tensorflowjs_model.pb';
// const WEIGHTS_URL = 'https://s3-us-west-1.amazonaws.com/theturkeyapp/weights_manifest.json';
const MODEL_URL = 'https://turkeyornah.com/tensorflowjs_model.pb';
const WEIGHTS_URL = 'https://turkeyornah.com/weights_manifest.json';

const IMAGENET_CLASSES = {
  0: 'green',
  1: 'mashed',
  2: 'turkey'
};

const IMAGE_SIZE = 224;
const TOPK_PREDICTIONS = 3;

export default class MobileNet{
    constructor(store, gobbleCb){
        this.store = store;
        this.gobble = gobbleCb;
        this.mobilenet = null;
    }

    setStatus(status){
        this.store.status = status;
    }

    async init(){
        this.setStatus('Loading...');
        // load the mobile net
        // this.mobilenet = await tf.loadModel(MOBILENET_MODEL_PATH);
        this.mobilenet = await tf.loadFrozenModel(MODEL_URL, WEIGHTS_URL);


        // Warmup the model. This isn't necessary, but makes the first prediction
        // faster. Call `dispose` to release the WebGL memory allocated for the return
        // value of `predict`.
        this.mobilenet.predict(tf.zeros([1, IMAGE_SIZE, IMAGE_SIZE, 3])).dispose();

        this.setStatus('Loaded');
        this.store.isModelLoaded = true;
        //
        // // Make a prediction
        // const tensorElement = document.getElementById('tensor-img');
        // if (tensorElement.complete && tensorElement.naturalHeight !== 0) {
        //     this.predict(tensorElement);
        //     tensorElement.style.display = '';
        // } else {
        //     tensorElement.onload = () => {
        //         this.predict(tensorElement);
        //         tensorElement.style.display = '';
        //     }
        // }
        //
        // document.getElementById('file-container').style.display = '';
    }

    async predict(imgElement) {
        const self = this;
        this.setStatus('Predicting...');

        const startTime = performance.now();
        const logits = tf.tidy(() => {
            // tf.fromPixels() returns a Tensor from an image element.
            const img = tf.fromPixels(imgElement).toFloat();

            const offset = tf.scalar(127.5);
            // Normalize the image from [0, 255] to [-1, 1].
            const normalized = img.sub(offset).div(offset);

            // Reshape to a single-element batch so we can pass it to predict.
            const batched = normalized.reshape([1, IMAGE_SIZE, IMAGE_SIZE, 3]);

            // Make a prediction through mobilenet.
            return self.mobilenet.predict(batched);
        });

        // Convert logits to probabilities and class names.
        const classes = await this.getTopKClasses(logits, TOPK_PREDICTIONS);
        const totalTime = performance.now() - startTime;
        this.setStatus(`Done in ${Math.floor(totalTime)}ms`);

        // Show the classes in the DOM.
        this.showResults(imgElement, classes);

        logits.dispose(); // cleanup
    }
    async getTopKClasses(logits, topK) {
        const values = await logits.data();

        const valuesAndIndices = [];
        for (let i = 0; i < values.length; i++) {
            valuesAndIndices.push({value: values[i], index: i});
        }
        valuesAndIndices.sort((a, b) => {
            return b.value - a.value;
        });
        const topkValues = new Float32Array(topK);
        const topkIndices = new Int32Array(topK);
        for (let i = 0; i < topK; i++) {
            topkValues[i] = valuesAndIndices[i].value;
            topkIndices[i] = valuesAndIndices[i].index;
        }

        const topClassesAndProbs = [];
        for (let i = 0; i < topkIndices.length; i++) {
            topClassesAndProbs.push({
                className: IMAGENET_CLASSES[topkIndices[i]],
                probability: topkValues[i]
            })
        }
        return topClassesAndProbs;
    }

    showResults(imgElement, classes) {
        this.store.classes = classes;
        const formatted = classes.map((classItem) => {
          return {
            probability: (classItem.probability * 100).toFixed(2),
            label: classItem.className.split(',')[0]
          }
        });
        const highProbabilityResults = formatted.filter((classItem) => classItem.probability > 70);
        const result = highProbabilityResults.length > 0 ? highProbabilityResults[0] : null;
        this.store.identified = !!result;
        if (result) {
          this.gobble();
        }
    }

    async predictImage(src){
        const self = this;
        // Fill the image & call predict.
        let img = document.createElement('img');
        img.src = src;
        img.width = IMAGE_SIZE;
        img.height = IMAGE_SIZE;
        img.onload = () =>  self.predict(img);
    }

}
