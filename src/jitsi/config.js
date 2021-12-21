export const getInitConfig = () => {
	return {
		disableAudioLevels: true,
		disableThirdPartyRequests: true,
	};
};
export const getConnectionConfig = ({roomId, domain}) => {
	return {
		hosts: {
			domain: domain,
			muc: `conference.${domain}`,
			focus: `focus.${domain}`,
		},
		serviceUrl: `https://${domain}/http-bind?room=${roomId}`,
		// serviceUrl: `wss://${domain}/xmpp-websocket?room=${roomId}`,
		// websocketKeepAliveUrl: `https://${domain}/_unlock`,
	};
};
export const getConferenceConfig = () => {
	return {
		p2p: {
			enabled: true,
		},
	};
};
export const getStreamConfig = () => ({
	audio: {},
	video: {
		height: {
			ideal: 405,
			max: 405,
			min: 180,
		},
		width: {
			ideal: 720,
			max: 720,
			min: 320,
		},
	},
});
