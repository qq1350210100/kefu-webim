

require('../common/polyfill');
var utils = require('../common/utils');
var loading = require('./loading');
var Iframe = require('./iframe');

window.easemobim = window.easemobim || {};
window.easemobim.config = window.easemobim.config || {};
window.easemobim.version = '__WEBIM_PLUGIN_VERSION__';
// todo: discard global tenants
window.easemobim.tenants = {};

if(
	/MSIE 7\.0/.test(navigator.userAgent)
	&& !window.localStorage
	&& !document.querySelector
){
	easemobim.bind = function(){
		alert("您使用的IE浏览器版本过低，请使用IE8以上版本的IE浏览器或Chrome浏览器");
	};
	throw new Error("unsupported browser.");
}

require('../../plugin-scss/easemob.scss');

var DEFAULT_CONFIG = {
	tenantId: '',
	to: '',
	agentName: '',
	appKey: '',
	domain: '',
	path: '',
	ticket: true,
	staticPath: "",
	buttonText: "联系客服",
	dialogWidth: "360px",
	dialogHeight: "550px",
	dragenable: true,
	minimum: true,
	soundReminder: true,
	dialogPosition: { x: "10px", y: "10px" },
	user: {
		username: "",
		password: "",
		token: ""
	}
};
config = utils.copy(DEFAULT_CONFIG);




reset();

// growing io user id
// 由于存在cookie跨域问题，所以从配置传过去
config.grUserId = utils.get("gr_user_id");


// init _config & concat config and global easemobim.config
function reset(){
	config = utils.copy(DEFAULT_CONFIG);
	utils.extend(config, easemobim.config);
	_config = utils.copy(config);

	var hide = utils.convertFalse(_config.hide) !== "" ? _config.hide : baseConfig.json.hide;
	var resources = utils.convertFalse(_config.resources) !== "" ? _config.resources : baseConfig.json.resources;
	var sat = utils.convertFalse(_config.satisfaction) !== "" ? _config.satisfaction : baseConfig.json.sat;

	_config.tenantId = _config.tenantId || baseConfig.json.tenantId;
	_config.configId = _config.configId || baseConfig.json.configId;
	_config.hide = utils.convertFalse(hide);
	_config.resources = utils.convertFalse(resources);
	_config.satisfaction = utils.convertFalse(sat);
	_config.domain = _config.domain || baseConfig.domain;
	_config.path = _config.path || (baseConfig.domain + "/webim");
	_config.staticPath = _config.staticPath || (baseConfig.domain + "/webim/static");
}
// get config from current script
function getConfig(){
	var src;
	var obj = {};
	var scripts = document.scripts;

	for(var s = 0, l = scripts.length; s < l; s++){
		if(~scripts[s].src.indexOf("easemob.js")){
			src = scripts[s].src;
			break;
		}
	}

	if(!src){
		return { json: obj, domain: "" };
	}

	var tmp;
	var idx = src.indexOf("?");
	var sIdx = ~src.indexOf("//") ? src.indexOf("//") : 0;
	var domain = src.slice(sIdx, src.indexOf("/", sIdx + 2));
	var arr = src.slice(idx + 1).split("&");

	for(var i = 0, len = arr.length; i < len; i++){
		tmp = arr[i].split("=");
		obj[tmp[0]] = tmp.length > 1 ? decodeURIComponent(tmp[1]) : "";
	}
	return { json: obj, domain: domain };
}

/*
 * @param: {String} 技能组名称，选填
 * 兼容旧版接口，建议使用easemobim.bind方法
 */
window.easemobIM = function(group){
	easemobim.bind({ emgroup: group });
};
window.easemobIMS = function(tenantId, group){
	easemobim.bind({ tenantId: tenantId, emgroup: group });
};

/*
 * @param: {Object} config
 */
easemobim.bind = function(config){
	// 防止空参数调用异常
	config = config || {};
	config.emgroup = config.emgroup || easemobim.config.emgroup || "";

	var cacheKeyName = config.configId || (config.tenantId + config.emgroup);

	for(var i in tenantList){
		if(tenantList.hasOwnProperty(i)){
			tenantList[i].close();
		}
	}

	iframe = tenantList[cacheKeyName];

	if(iframe){
		iframe.open();
	}
	else{
		utils.isMobile && loading.show();
		reset();
		utils.extend(_config, config);

		if(!_config.tenantId && !_config.configId){
			console.error("未指定tenantId!");
			return;
		}

		iframe = Iframe(_config);
		tenantList[cacheKeyName] = iframe;
		iframe.set(_config, iframe.open);
	}

};

// open api1: send custom extend message
easemobim.sendExt = function(ext){
	if(iframe){
		iframe.send({
			ext: ext
		});
	}
	else{
		console.error("The chat window is not initialized.");
	}
};

// open api2: send text message
/*
 * @param: {object} 消息体
 * {
 *		data: "text msg",
 *		ext: {}
 * }
 */

easemobim.sendText = function(msg){
	if(iframe){
		iframe.sendText(msg);
	}
	else{
		console.error("The chat window is not initialized.");
	}
};

// auto load
if(
	(!_config.hide || _config.autoConnect || _config.eventCollector)
	&& (_config.tenantId || _config.configId) && !utils.isMobile
){
	var cacheKeyName = _config.configId || (config.tenantId + (config.emgroup || ""));

	iframe = tenantList[cacheKeyName] || Iframe(_config);
	tenantList[cacheKeyName] = iframe;
	iframe.set(_config, iframe.close);
	// 访客上报用后失效
	easemobim.config.eventCollector = false;
}

//support cmd & amd
if (typeof module === 'object' && typeof module.exports === 'object'){
	module.exports = easemobim;
}
else if (typeof define === 'function' && define.amd){
	define('easemob-kefu-webim-plugin', [], function(){
		return easemobim;
	});
}
