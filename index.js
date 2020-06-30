const axios = require("axios");
const utl = require("./libs");

/**
 *
 * @param {Object} opts
 * @param {String} opts.apiDomain   收钱吧请求域名
 * @param {String} opts.appId       app id，从服务商平台获取
 * @param {String} opts.notifyUrl   回调通知接口路径
 * @param {String} opts.returnUrl   支付回调通知页面
 * @param {String} opts.vendorSn    服务商序列号
 * @param {String} opts.vendorKey   服务商密钥
 * @param {String} opts.gateWay     web支付网关地址
 * @param {Boolean} [opts.sandbox]  是否是沙盒环境
 * @constructor
 */
function Sqbpay(opts) {
  this.api_domain = opts.apiDomain;
  this.vendor_sn = opts.vendorSn;
  this.vendor_key = opts.vendorKey;
  this.appid = opts.appId;
  this.gate_way = opts.gateWay;
  this.notifyUrl = opts.notifyUrl;
  this.returnUrl = opts.returnUrl;
}

var props = Sqbpay.prototype;


/**
 * 收钱吧激活
 * @param {Object} opts
 * @param {String} [opts.appId]      app id，从服务商平台获取 是否必填：Y
 * @param {String} [opts.code]      激活码 是否必填：Y
 * @param {String} [opts.deviceId]  设备唯一身份ID 是否必填：Y
 * @param {String} [opts.clientSn]  第三方终端号，必须保证在app id下唯一 是否必填：N
 * @param {String} [opts.name]      终端名 是否必填：N
 */
props.activate = function (opts) {

  var biz_content = {
    app_id: this.appId,
    code: opts.code,
    device_id: opts.deviceId,
    client_sn: opts.clientSn,
    name: opts.name
  };
  const sign = utl.md5(JSON.stringify(biz_content) + this.vendor_key);
  const url = `${this.api_domain}/terminal/activate`;
  return axios({
    method: "POST",
    url,
    headers: {
      "Authorization": this.vendor_sn + " " + sign,
      "Content-Type": "application/json"
    },
    data: biz_content
  });

};

/**
 * 生成支付参数供web端使用(网关支付)
 * @param {Object} opts
 * @param {String} opts.terminalSn           收钱吧终端id
 * @param {String} opts.terminalKey          终端密钥
 * @param {String} opts.clientSn             商户网站唯一订单号
 * @param {String} opts.totalAmount          交易总金额,单位：分
 * @param {String} opts.subject              交易简介
 * @param {String} opts.operator             发起本次交易的操作员
 * @param {String} opts.reflect              任何调用者希望原样返回的信息
 * @param {String} opts.notifyUrl            支付回调的地址
 * @param {String} opts.returnUrl            支付回调通知页面
 */
props.webPay = function (opts) {
  var biz_content = {
    terminal_sn: opts.terminalSn,
    subject: opts.subject,
    client_sn: opts.clientSn,
    total_amount: opts.totalAmount,
    operator: opts.operator,
    reflect: opts.reflect,
    notify_url: opts.notifyUrl,
    return_url: opts.returnUrl
  };
  const { unencode, encode } = utl.encodeParams(biz_content);
  const sign = utl.md5(`${unencode}&key=${opts.terminalKey}`).toUpperCase();
  return `${this.gate_way}?${encode}&sign=${sign}`;
};


/**
 * 查询交易状态 sn与client_sn不能同时为空，优先按照sn查找订单，如果没有，再按照client_sn查询
 * @param {Object} opts
 * @param {String} [opts.terminalSn]    收钱吧终端ID
 * @param {String} [opts.terminalKey]   终端密钥
 * @param {String} [opts.sn]            收钱吧系统订单号
 * @param {String} [opts.clientSn]      商户自己的订单号
 * @param {String} [opts.refundNo]      收钱吧系统退款订单号,20长度,调用退款接口时，传入得值
 */
props.query = function (opts) {
  const biz_content = {
    terminal_sn: opts.terminalSn,
    sn: opts.sn,
    refund_request_no: opts.refundNo,
    client_sn: opts.clientSn
  };
  const sign = utl.md5(JSON.stringify(biz_content) + opts.terminalKey);
  const url = `${this.api_domain}/upay/v2/query`;
  return axios({
    method: "POST",
    url,
    headers: {
      "Authorization": opts.terminalSn + " " + sign,
      "Content-Type": "application/json"
    },
    data: biz_content
  });
};


/**
 * 统一收单交易退款接口
 * @param {Object} opts
 * @param {String} [opts.terminalSn]    收钱吧终端ID
 * @param {String} [opts.terminalKey]   终端密钥
 * @param {String} [opts.sn]            收钱吧系统订单号
 * @param {String} [opts.operator]      执行本次退款的操作员
 * @param {String} [opts.clientSn]      商户自己的订单号
 * @param {String} [opts.refundAmount]  退款金额
 * @param {String} [opts.refundNo]      收钱吧系统退款订单号， 20长度
 */
props.refund = function (opts) {

  var biz_content = {
    terminal_sn: opts.terminalSn,
    client_sn: opts.clientSn,
    sn: opts.sn,
    operator: opts.operator || "skzn",
    refund_amount: opts.refundAmount.toString(),
    refund_request_no: opts.refundNo
  };
  const sign = utl.md5(JSON.stringify(biz_content) + opts.terminalKey);
  const url = `${this.api_domain}/upay/v2/refund`;
  return axios({
    method: "POST",
    url,
    headers: {
      "Authorization": opts.terminalSn + " " + sign,
      "Content-Type": "application/json"
    },
    data: biz_content
  });
};
module.exports = Sqbpay;