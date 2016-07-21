/**
 * Created by luc on 20/07/16.
 */

var OLD_DOC_TYPE = '<!DOCTYPE sqlMap PUBLIC "-//ibatis.apache.org//DTD SQL Map 2.0//EN" "http://ibatis.apache.org/dtd/sql-map-2.dtd">';
var NEW_DOC_TYPE = '<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN" "http://mybatis.org/dtd/mybatis-3-mapper.dtd">';

var ERROR = 0;
var INFO = 1;
var SUCCESS = 2;
var ALIAS_REGEX = /(<\s*typeAlias\s+alias\s*\s*=")([a-zA-Z0-9_]+)("\s+type\s*=\s*")([a-zA-Z0-9\._]+)("\s*\/\s*>)/g;
var ALIAS_WITH_NEW_LINE_REGEX = /(<\s*typeAlias\s+alias\s*\s*=")([a-zA-Z0-9_]+)("\s+type\s*=\s*")([a-zA-Z0-9\._]+)("\s*\/\s*>\s*\n*)/g;
var PARA_REGEX = /parameterClass\s*=/g;
var RESULT_REGEX = /resultClass\s*=/g;
var INLINE_PARA_REGEX = /(#)([a-zA-Z0-9_"\.]+)(#)/g;

String.prototype.classes = [];
String.prototype.inlineParams = [];
String.prototype.listParams = [];
String.prototype.loops = [];

String.prototype.changeDOCType = function () {
  var str = this;
  str = str.replace(OLD_DOC_TYPE, NEW_DOC_TYPE);
  return str;
};

String.prototype.changeSqlMap2Mapper = function (namespace) {
  var str = this;
  var reg = /sqlMap\s+namespace\s*=\s*"[a-zA-Z0-9_\-]+"\s*/g;
  str = str.replace(reg, 'mapper namespace="' + namespace + '"');
  str = str.replace(/\/sqlMap/g, "/mapper");
  return str;
};

String.prototype.removeComment = function () {
  var str = this;
  str = str.replace(/(<!--.*-->)\s*\n*/g, '');
  return str;
};

String.prototype.correctPackage = function () {
  var str = this;
  str = str.replace(/(\.dto\.table\.)/g, ".model.");
  str = str.replace(/(\.dto\.)/g, ".model.");
  str = str.replace(/(com\.dou\.)/g, "com.dounets.blp.");
  return str;
};

String.prototype.replaceAliasByClass = function () {
  var str = this;

  // Get all classes & alias
  var j = 0;
  while ((m = ALIAS_REGEX.exec(str)) !== null) {
    if (m.index === ALIAS_REGEX.lastIndex) {
      ALIAS_REGEX.lastIndex++;
    }
    str.classes[j++] = {
      alias: m[2],
      class: m[4]
    };
  }

  // Remove all typeAlias
  str = str.replace(ALIAS_WITH_NEW_LINE_REGEX, "");

  // Change class="ALIAS" to class="CLASS"
  for (var i = 0; i < str.classes.length; i++) {
    var reg = new RegExp('class\s*=\s*"' + str.classes[i].alias + '"', 'g');
    str = str.replace(reg, 'class="' + str.classes[i].class + '"');
  }
  return str;
};

String.prototype.changeClassToType = function () {
  var str = this;
  str = str.replace(PARA_REGEX, "parameterType");
  str = str.replace(RESULT_REGEX, "resultType");
  return str;
};

String.prototype.changeParameterType = function () {
  var str = this;
  str = str.replace(/hashMap/g, "HashMap");
  return str;
};

String.prototype.changeInlineParameter = function () {
  var str = this;
  var i = 0;
  while ((m = INLINE_PARA_REGEX.exec(str)) !== null) {
    if (m.index === INLINE_PARA_REGEX.lastIndex) {
      INLINE_PARA_REGEX.lastIndex++;
    }
    str.inlineParams[i++] = m[2];
  }

  for (i = 0; i < str.inlineParams.length; i++) {
    var reg = new RegExp('#' + str.inlineParams[i] + '#', 'g');
    str = str.replace(reg, "#{" + str.inlineParams[i].replace(/"/g, "") + "}");
  }
  return str;
};

String.prototype.changeItemInLoop = function () {
  var str = this;
  var re = /(#)([a-zA-Z0-9_]+)(\[\])(\.)*([a-zA-Z0-9_]+)*(#)/g;
  var m;
  var i = 0;

  while ((m = re.exec(str)) !== null) {
    if (m.index === re.lastIndex) {
      re.lastIndex++;
    }
    str.listParams[i++] = {
      item: m[2],
      prop: m[5]
    };
  }

  for (i = 0; i < str.listParams.length; i++) {
    var strRegex = '#' + str.listParams[i].item + "\\[\\]\\.";
    var strReplace = "#{item";
    if (str.listParams[i].prop) {
      strRegex += str.listParams[i].prop;
      strReplace += "." + str.listParams[i].prop;
    }
    strRegex += "#";
    strReplace += "}";
    var reg = new RegExp(strRegex, 'g');
    str = str.replace(reg, strReplace);
  }

  return str;
};

String.prototype.changeLoop = function () {
  var str = this;
  var re = /(iterate\s+property\s*=\s*")([a-zA-Z_0-9]+)(")((\s+open=\s*"(\()"\s+close\s*=\s*"(\))"\s+conjunction\s*=\s*")(\s*,\s*)("))*/g;
  var m;
  var i = 0;

  while ((m = re.exec(str)) !== null) {
    if (m.index === re.lastIndex) {
      re.lastIndex++;
    }

    str.loops[i++] = {
      collection: m[2],
      open: m[6],
      close: m[7],
      separator: m[8]
    };
  }

  for (i = 0; i < str.loops.length; i++) {
    if (!str.loops[i].open) {
      var reg = new RegExp('(iterate\\s+property\\s*=\\s*")(' + str.loops[i].collection + ')(")');
      str = str.replace(reg, 'foreach collection="' + str.loops[i].collection + '" index="index" item="item"');
    }
  }

  for (i = 0; i < str.loops.length; i++) {
    if (str.loops[i].open) {
      var reg = new RegExp('(iterate\\s+property\\s*=\\s*")(' + str.loops[i].collection + ')(")((\\s+open=\\s*"'
        + str.loops[i].open + '"\\s+close\\s*=\\s*"(' + str.loops[i].close + ')"\\s+conjunction\\s*=\\s*")' + str.loops[i].separator + '("))*');
      str = str.replace(reg, 'foreach collection="' + str.loops[i].collection + '" index="index" item="item" open="'
        + str.loops[i].open + '" close="' + str.loops[i].close + '" separator="' + str.loops[i].separator + '"');
    }
  }

  str = str.replace(/\/iterate/g, "/foreach");
  str = str.replace(/\s+open\s*=\s*"\("\s+close\s*=\s*"\)"\s+conjunction\s*=\s*","/g, "");

  return str;
};

String.prototype.changeJDBCType = function () {
  var str = this;
  str = str.replace(new RegExp('jdbcType\s*=\s*"ORACLECURSOR"', 'g'), 'jdbcType="CURSOR"');
  str = str.replace(new RegExp('jdbcType\s*=\s*"NUMBER"', 'g'), 'jdbcType="NUMERIC"');
  return str;
};

$(document).ready(function () {
  $('#btnConvert').on('click', function () {
    var namespace = $('#txtNamespace').val();
    var iBatisText = $('#iBatisText').val();
    if (!/^(com\.dounets\.blp\.)([a-z0-9_\-]+\.)+([a-zA-Z0-9]+DAO)$/.test(namespace)) {
      showMessage(ERROR, 'The namespace is wrong, please check again');
      return;
    }

    var result = iBatisText.changeDOCType()
      .changeSqlMap2Mapper(namespace)
      .removeComment()
      .correctPackage()
      .replaceAliasByClass()
      .changeClassToType()
      .changeParameterType()
      .changeInlineParameter()
      .changeItemInLoop()
      .changeLoop()
      .changeJDBCType();

    $('#myBatisText').val(result);

    showMessage(SUCCESS, "<li>Convert Success, Please check all model again</li>" +
      "<li>If there is any bugs, please report at <a href='https://github.com/lucduong/ibatis2mybatis/issues'>Issues</a> </li>");
  });

  $('#btnReset').on('click', function () {
    $('#iBatisText, #myBatisText, #txtNamespace').val('');
  });

  var showMessage = function (type, msg) {
    $('#msg').show();
    $('#msg').html(msg);
    switch (type) {
      case ERROR:
        $('#msg').attr('class', 'alert alert-danger');
        break;
      case INFO:
        $('#msg').attr('class', 'alert alert-info');
        break;
      case SUCCESS:
        $('#msg').attr('class', 'alert alert-success');
        break;
    }
  };
});