import {getConferenceConfig, getConnectionConfig, getInitConfig} from './jitsi/config';
import {
	findDefaultDevice,
	getDeviceList,
	jitsiCreateConference,
	jitsiCreateConnection,
	saveDeviceId,
} from './jitsi/jitsiUtils';

const JitsiMeetJS = window.JitsiMeetJS;
JitsiMeetJS.init(getInitConfig());
JitsiMeetJS.setLogLevel(JitsiMeetJS.logLevels.ERROR);

const config = {
	domain: 'meet.jit.si',
	appId: null,
	jwt: null,
	roomId: '',
};

const el_welcome = $('#welcome');
const el_room = $('#room');
const el_roomNameInput = $('#room_name_input');
const el_btnRoomName = $('#btn_room_name');
const el_btnStart = $('#start');
const el_btnStop = $('#stop');
const el_mediaContainer = $('#media_container');
const el_selectVideo = $('#select_video');
const el_selectAudio = $('#select_audio');

let connection = null;
let conference = null;
let deviceList = null;

let selectedDevice = {
	audioId: null,
	videoId: null,
};

const createMediaEl = (id, type) => {
	if (type === 'audio') {
		return $(`<audio autoplay loop id="${id}"/>`);
	} else {
		return $(`<video autoplay playsinline webkit-playsinline id="${id}"/>`);
	}
};

const setLocalStream = (tracks) => {
	const videoTrack = tracks.find(track => track.getType() === 'video');
	if (!videoTrack) return;
	const el_video = createMediaEl('local_video', 'video');
	el_mediaContainer.append(el_video);
	videoTrack.attach(el_video[0]);
	el_btnStart.hide();
	el_btnStop.show();
};

const unsetLocalStream = () => {
	$('#local_video').remove();
	el_btnStart.show();
	el_btnStop.hide();
};

const startStream = async () => {
	const tracks = await JitsiMeetJS.createLocalTracks({
		devices: [
			selectedDevice.videoId ? 'video' : null,
			selectedDevice.audioId ? 'audio' : null,
		],
		cameraDeviceId: selectedDevice.videoId || undefined,
		micDeviceId: selectedDevice.audioId || undefined,
		// constraints: getStreamConfig(),
		resolution: '360',
	}, true);
	setLocalStream(tracks);
	tracks.forEach((track) => {
		conference.addTrack(track);
	});
};

const stopStream = async () => {
	try {
		const tracks = conference.getLocalTracks();
		await Promise.all(tracks.map((t) => t.dispose()));
		unsetLocalStream();
	} catch (e) {
		console.log('Error[stopPublishStream]: ', e);
	}
};

const addRemoteTrack = (track) => {
	const id = track.getId();
	const type = track.getType();
	const el = createMediaEl(id, type);
	el_mediaContainer.append(el);
	track.attach(el[0]);
};

const removeRemoteTrack = (track) => {
	const id = track.getId();
	const el = $(`#${id}`);
	el.remove();
};

const onRemoteTrackAdded = (track) => {
	if (track.isLocal()) return;
	addRemoteTrack(track);
};

const onRemoteTrackRemoved = (track) => {
	if (track.isLocal()) return;
	removeRemoteTrack(track);
};

const selectDevice = (id, type) => {
	selectedDevice[`${type}Id`] = id;
	saveDeviceId(id, type);
};

const selectDefaultDevices = function() {
	const defaultDeviceAudio = findDefaultDevice(deviceList.audio, 'audio');
	const defaultDeviceVideo = findDefaultDevice(deviceList.video, 'video');
	selectDevice(defaultDeviceAudio?.deviceId, 'audio');
	selectDevice(defaultDeviceVideo?.deviceId, 'video');
};

const updateDeviceList = (videoDevices, audioDevices) => {
	deviceList = {
		video: videoDevices,
		audio: audioDevices,
	};
	audioDevices.forEach(audio => {
		el_selectAudio.append($('<option>', {value: audio.deviceId, text: audio.label}));
	});
	videoDevices.forEach(video => {
		el_selectVideo.append($('<option>', {value: video.deviceId, text: video.label}));
	});
};

const initJitsi = async function() {
	const confConnect = getConnectionConfig(config);
	const confConference = getConferenceConfig();
	connection = await jitsiCreateConnection(config.appId, config.jwt, confConnect);
	conference = await jitsiCreateConference(connection, config.roomId, confConference);
	conference.addEventListener(JitsiMeetJS.events.conference.TRACK_ADDED, onRemoteTrackAdded);
	conference.addEventListener(JitsiMeetJS.events.conference.TRACK_REMOVED, onRemoteTrackRemoved);
	const {video, audio} = await getDeviceList();
	updateDeviceList(video, audio);
	selectDefaultDevices();
};

const onClickBtnRoomName = async () => {
	config.roomId = el_roomNameInput.val();
	if (!config.roomId) return;
	await initJitsi();
	el_welcome.hide();
	el_room.show();
};

const onClickBtnStart = async () => {
	await startStream();
};

const onClickBtnStop = async () => {
	await stopStream();
};

const onSelectVideo = (evt) => {
	selectDevice(evt.target.value, 'video');
};

const onSelectAudio = (evt) => {
	selectDevice(evt.target.value, 'audio');
};

el_btnRoomName.on('click', onClickBtnRoomName);
el_btnStart.on('click', onClickBtnStart);
el_btnStop.on('click', onClickBtnStop);
el_selectVideo.on('input', onSelectVideo);
el_selectAudio.on('input', onSelectAudio);
