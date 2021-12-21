const JitsiMeetJS = window.JitsiMeetJS;
let _onConnectionEstablished = null;
let _onConnectionFailed = null;

let _onConferenceJoined = null;
let _onConferenceFailed = null;

export const jitsiCreateConnection = (appId, token, config) => {
	return new Promise((resolve, reject) => {
		let connection = null;

		const removeListeners = () => {
			connection.removeEventListener(JitsiMeetJS.events.connection.CONNECTION_ESTABLISHED, _onConnectionEstablished);
			connection.removeEventListener(JitsiMeetJS.events.connection.CONNECTION_FAILED, _onConnectionFailed);
			_onConnectionEstablished = null;
			_onConnectionFailed = null;
		}

		_onConnectionEstablished = () => {
			removeListeners();
			resolve(connection);
		};

		_onConnectionFailed = (error) => {
			removeListeners();
			console.error(error);
			reject('Error[jitsiCreateConnection]');
		};

		connection = new JitsiMeetJS.JitsiConnection(appId, token, config);
		connection.addEventListener(JitsiMeetJS.events.connection.CONNECTION_ESTABLISHED, _onConnectionEstablished);
		connection.addEventListener(JitsiMeetJS.events.connection.CONNECTION_FAILED, _onConnectionFailed);
		connection.connect();
	});
};

export const jitsiCreateConference = (connection, roomId, config) => {
	return new Promise((resolve, reject) => {
		let conference = null;
		const removeListeners = () => {
			conference.removeEventListener(JitsiMeetJS.events.conference.CONFERENCE_JOINED, _onConferenceJoined);
			conference.removeEventListener(JitsiMeetJS.events.conference.CONFERENCE_FAILED, _onConferenceFailed);
			conference.removeEventListener(JitsiMeetJS.events.conference.CONFERENCE_ERROR, _onConferenceFailed);
			_onConferenceJoined = null;
			_onConferenceFailed = null;
		}

		_onConferenceJoined = () => {
			removeListeners();
			resolve(conference);
		};

		_onConferenceFailed = (error) => {
			removeListeners();
			console.error(error);
			reject('Error[jitsiCreateConference]');
		};

		conference = connection.initJitsiConference(roomId, config);
		conference.addEventListener(JitsiMeetJS.events.conference.CONFERENCE_JOINED, _onConferenceJoined);
		conference.addEventListener(JitsiMeetJS.events.conference.CONFERENCE_FAILED, _onConferenceFailed);
		conference.addEventListener(JitsiMeetJS.events.conference.CONFERENCE_ERROR, _onConferenceFailed);
		conference.join();
	});
};

const getDeviceType = (kind) => {
	switch (kind) {
		case 'videoinput':
			return 'video';
		case 'audiooutput':
			return 'speaker';
		default:
			return 'audio';
	}
};

const getList = (devices = []) => {
	return devices.reduce((res, device) => {
		const type = getDeviceType(device.kind);
		res[type].push({
			deviceId: device.deviceId,
			label: device.label,
			kind: device.kind,
			type: type,
		});
		return res;
	}, {
		video: [],
		audio: [],
		speaker: [],
	})
}

const getConstraints = (devices = []) => {
	const constraints = {};
	const kind = 'input';
	devices.forEach((device) => {
		if (device.kind.indexOf("audio" + kind) === 0) {
			constraints.audio = true;
		} else if (device.kind.indexOf("video" + kind) === 0) {
			constraints.video = true;
		}
	})
	return constraints;
};

export const getDeviceList = async () => {
	return new Promise((resolve, reject) => {
		navigator.mediaDevices.enumerateDevices().then((devices) => {
			const constraints = getConstraints(devices);
			navigator.getUserMedia(constraints, (stream) => {
				navigator.mediaDevices.enumerateDevices().then((devicesWithLabels) => {
					resolve(getList(devicesWithLabels));
					stream.getTracks().forEach((track) => track.stop());
				}, reject)
			}, reject)
		}, reject)
	})
}

const getLsKey = (type) => `saveDeviceId_${type}`;

export const findDefaultDevice = (deviceList, type) => {
	const savedDeviceId = localStorage.getItem(getLsKey(type)) || null;
	return deviceList.find((device) => (
		device.deviceId === savedDeviceId
	)) || deviceList.find((device) => (
		device.deviceId === 'default'
	)) || deviceList[0];
}

export const saveDeviceId = (deviceId, type) => {
	if (deviceId) {
		localStorage.setItem(getLsKey(type), deviceId);
	} else {
		localStorage.removeItem(getLsKey(type));
	}
}
