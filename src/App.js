import React, {Component} from 'react';
import {observer} from 'mobx-react';
import Webcam from 'react-webcam';
import MobileNet from './tensorflow/MobileNet';
import './_build/App.css';
// import tensorflowlogo from './img/tensorflowjs.png';
import { Howl, Howler } from 'howler';
import emojiRain from './emoji-rain';

// const getFacingModePattern = (facingMode) => facingMode == 'environment'
//   ? /rear|back|environment/ig
//   : /front|user|face/ig
const facingModePattern = /rear|back|environment/ig;
const mobileConstraints = {
  // width: 1280,
  // height: 720,
  facingMode: { exact: "environment" }
};
const desktopConstraints = {
  // width: 1280,
  // height: 720,
  facingMode: 'user'
};
const gobbleURL = 'https://turkeyornah.com/gobblegobble.m4a';
var isMobile = false; //initiate as false
// device detection
if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|ipad|iris|kindle|Android|Silk|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(navigator.userAgent)
  || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(navigator.userAgent.substr(0, 4))) {
  isMobile = true;
}
class App extends Component {
    constructor(props){
        super(props);
        this.state = {
            devices: null,
            identified: null,
            videoConstraints: isMobile ? mobileConstraints : desktopConstraints,
            playing: false
        };
        this.mobileNet = null;
        // this.gobbleSound = new Sound(gobbleURL, 100, true);
        this.gobbleSound = new Howl({
          src: [gobbleURL],
          // autoplay: true,
          loop: true,
          volume: 0.8,
          // onend: function () {
          //   console.log('Finished!');
          // }
        });
        let videoDevices = [];
        navigator.getUserMedia =
          navigator.mediaDevices.getUserMedia ||
          navigator.webkitGetUserMedia ||
          navigator.mozGetUserMedia ||
          navigator.msGetUserMedia;

        navigator.mediaDevices
          .getUserMedia({video: true, audio: false})
          .then((stream) => {
            navigator.mediaDevices.enumerateDevices().then(devices => {
                for(let i = 0; i < devices.length; i++){
                    if(devices[i].kind === 'videoinput'){
                        videoDevices.push(devices[i]);
                    }
                }
                // const pattern = getFacingModePattern('environment');

                // Filter out video devices without the pattern
                const filteredDevices = videoDevices.filter(({ label }) =>
                  facingModePattern.test(label.toLowerCase()));
                
              // console.log('video devices:', filteredDevices)
              this.setState({ devices: filteredDevices});
            });

          })
          .catch((e) => {
            console.error(e)
          });
    }

    gobble = () => {
      if (!this.state.playing) {
        // console.log('not equal!')
        this.setState({ playing: true });
        this.gobbleSound.play();
        emojiRain();
        setTimeout(() => {
          this.gobbleSound.stop();
          this.setState({ playing: false });
        }, 3000);
      }
    }

    capture = async () => {
        const self = this;
        const imageSrc = this.webcam.getScreenshot();
        await this.mobileNet.predictImage(imageSrc);
        setTimeout(()=>{
            self.capture();
        }, 500);
    };


    setRef = (webcam) => {
        this.webcam = webcam;
    };

    webcamLoaded = async () =>{
        // now we can rock and roll
        this.props.store.isWebcamLoaded = true;
        console.log('webcam loaded');
        const self = this;
        this.mobileNet = new MobileNet(this.props.store, this.gobble);
        await this.mobileNet.init();
        console.log('Model Loaded');
        this.capture();

        //
    };


    render() {
      const { status, classes, isModelLoaded, identified, formatted} = this.props.store;
      const { videoConstraints, playing } = this.state;
        const videoStyle = {
          width: 'auto',
          minHeight: '100%',
          minWidth: '100%'
        };

        let classifiers = [];
        if(classes){
            for(let i = 0; i < classes.length; i++){
                const probabilityStr = `${(classes[i].probability * 100).toFixed(2)}%`;
                const singleClass = classes[i].className.split(',')[0];
                classifiers.push(
                    <tr key={i}>
                        <td className="left">{singleClass}</td>
                        <td className="right">{probabilityStr}</td>
                    </tr>
                )
            }
        }
        if(this.state.devices){
            return (
                <div className="App">
                    <div id="animate" style={{opacity: playing ? 1 : 0}}/>
                    {playing && <div className="message">It's a TURKEY!!</div>}
                    {!playing && <div className="message-small">Not a TURKEY :(</div>}
                    <div className="webcam-container">
                        <Webcam
                            audio={false}
                            ref={this.setRef}
                            screenshotFormat="image/jpeg"
                            style={videoStyle}
                            onUserMedia={this.webcamLoaded}
                            videoConstraints={videoConstraints}
                            // videoSource={this.state.devices[0].deviceId}
                            // audioSource={'null'}
                        />
                    </div>
                    {(status === 'Loading...') && <div className="status">{status}</div>}
                    {/* {identified && <div className="identified">{JSON.stringify(identified)}</div>} */}
                    {/* <div className="classes">
                        <table>
                            <thead>
                            <tr>
                                <th className="left">Classifier</th>
                                <th className="right">Probability</th>
                            </tr>
                            </thead>
                            <tbody>
                            {classifiers}
                            </tbody>
                        </table>
                    </div> */}
                    <div className="ismodelloaded">{isModelLoaded}</div>
                    {/*<pre>{JSON.stringify(this.state.devices, null, 4)}</pre>*/}


                </div>
            );
        } else {
            return(<div className='status'>waiting for camera...</div>)
        }
    }
}

export default observer(App);
