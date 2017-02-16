
function getUrlFragment() {
    // var source = document.URL;
    // return source.split("#")[1];
    return window.location.hash;
}

function getUrlQueryString() {
    return window.location.search;
}


function getUrlQueryParameters(queryString) {
    var parameters = new Object();
    var startIndex = -1;
    if(startIndex == -1) {
        startIndex = queryString.indexOf("?");
    }
    if(startIndex == -1) {
        startIndex = queryString.indexOf("#");
    }
    if(startIndex == -1) {
        return parameters;
    }

    {
        var str = queryString.substr(startIndex);
        strs = str.split("&");
        for(var i = 0; i < strs.length; i ++) {
            parameters[strs[i].split("=")[0]] = unescape(strs[i].split("=")[1]);
        }
    }
    return parameters;
}

function init() {
    var urlFragment = getUrlFragment();
    var urlQueryString = getUrlQueryString();

    $("#urlFragment").val(urlFragment);
    $("#urlQueryString").val(urlQueryString);
};

window.onload = init;
