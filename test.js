$(function () {
  onloadPage();
  createModalPopup();
});

function onloadPage() {
  // Tabbar 생성
  $("#gridTabbar").createTabbar({
    clickEvent: [
      {
        event: function () {
          mv_nowScriptType = "C";
          if ($("#btnUploadContent").length > 0) {
            $("#btnUploadContent").remove();
          }
        },
      },
      {
        event: function () {
          mv_nowScriptType = "P";
          mfn_productGrid.load("#productGrid");

          if ($("#btnUploadContent").length < 1) {
            var htmlStr = "";
            htmlStr += '<button onclick="onclickUploadContent(this);" id="btnUploadContent" class="btn_upload_content">단락 업로드</button>';

            var $body = $("#gridTabbar .ui_tabbar_header");
            $body.append(htmlStr);
          }
        },
      },
    ],
  });

  // 스크립트 관리 구분목록 조회 후 화면 출력
  var onevent = function (isSuccess, data) {
    var resultMap = data.resultMap;
    var resultLength = resultMap.length;
    var htmlStr = "";
    for (var i = 0; i < resultLength; i++) {
      var item = resultMap[i];
      var code = item.CD;
      var codeName = item.CD_NM;

      htmlStr += '<option value="' + code + '">' + codeName + "</option>";
    }
    $("#scriptGroupList").html(htmlStr);

    mfn_scriptGrid.load("#scriptGrid");

    setContentView("INIT");

    $("#btnWriteScriptEdit").on("click", function () {
      if (gfn_isEmpty(mv_nowScriptGroupCode)) {
        gfn_alert("선택 된 스크립트 구분이 없습니다.");
        return false;
      }
      mfn_setScriptPopup.write();
      openModal("#popupScriptEdit");
    });
  };
  var params = {
    parentCode: "20000",
  };
  gfn_ajax("/selectScriptGroupList.do", "POST", params, true, onevent);
}

function createModalPopup() {
  $("#popupUploadFile").createModal({
    title: "파일 업로드",
    width: 500,
    draggable: true,
    callback: function () {
      onloadDropzone("FILE");

      var $popup = $("#popupUploadFile");

      // 팝업창 닫을 때 파일 초기화
      $popup.find(".layer_popup_btn_close").on("click", function () {
        var dropzone = $(".dropzone")[0].dropzone;
        dropzone.removeAllFiles();
      });
    },
  });

  $("#popupUploadContent").createModal({
    title: "단락 업로드",
    width: 500,
    draggable: true,
    callback: function () {
      onloadDropzone("CONTENT");

      var $popup = $("#popupUploadContent");

      // 팝업창 닫을 때 파일 초기화
      $popup.find(".layer_popup_btn_close").on("click", function () {
        var dropzone = $(".dropzone")[1].dropzone;
        dropzone.removeAllFiles();
      });
    },
  });

  $("#popupScriptEdit").createModal({
    title: "스크립트 관리",
    width: 500,
    draggable: true,
    callback: function () {
      $("#btnInsertScript").on("click", function () {
        gfn_confirm("스크립트 정보를 등록하시겠습니까?", function () {
          crudScript.insert();
        });
      });

      $("#btnUpdateScript").on("click", function () {
        gfn_confirm("스크립트 정보를 수정하시겠습니까?", function () {
          crudScript.update();
        });
      });

      $("#btnModifyScript").on("click", function () {
        mfn_setScriptPopup.modify();
      });
    },
  });
}

function setContentView(mode) {
  var $contentView = $("#contentView");
  switch (mode) {
    case "INIT":
      {
        mv_fileId = "";
        mv_nowScriptIndex = null;
        mv_nowScriptData = {};

        mv_nowContentList = [];
        mv_nowContentData = {};

        var htmlStr = "";
        htmlStr += '<div id="emptyContent" class="empty_content">';
        htmlStr += "<p>선택 된 스크립트가 없습니다!</p>";
        htmlStr += "</div>";

        $contentView.fadeOut(0, function () {
          $(this).html(htmlStr).fadeIn(500);
        });
      }
      break;
    case "EMPTY":
      {
        mv_nowContentList = [];
        mv_nowContentData = {};

        var scriptCode = "";
        if (mv_nowScriptType == "C") {
          scriptCode = mv_nowScriptData.SCT_CODE;
        } else {
          scriptCode = mv_nowScriptData.PRD_CODE_A;
        }

        var htmlStr = "";
        htmlStr += '<div id="emptyContent" class="empty_content">';
        htmlStr += "<p>작성 된 내용이 없습니다!</p>";
        htmlStr += '<button onclick="onclickRegistContentView(this);" id="btnAddContent" class="btn_add_content" data-script-code="' + scriptCode + '">단락 추가</button>';
        htmlStr += "</div>";

        $contentView.fadeOut(0, function () {
          $(this).html(htmlStr).fadeIn(500);
        });
      }
      break;
  }
}

// 선택 된 공통스크립트 정보
var mv_fileId = ""; // 스크립트 파일 ID
var mv_nowScriptGroupCode = ""; // 선택 된 스크립트 그룹
var mv_nowScriptIndex = null; // 선택 된 스크립트 인덱스
var mv_nowScriptData = {}; // 선택 된 스크립트 데이터
var mv_nowScriptType = ""; // 선택 된 스크립트 유형	C: 공통스크립트 P: 상품스크립트

// 스크립트 그리드 객체 정보
var mv_scriptGridObj = null;
var mv_scriptGridParam;
var mfn_scriptGrid = {
  reload: function () {
    mv_scriptGridParma = new Object();
    mv_scriptGridParam = {
      mapperName: "script.selectScriptList",
      scriptGroupCode: mv_nowScriptGroupCode,
    };
    var url = gv_contextInfo.contextPath + "/selectGridData.do";
    mv_scriptGridObj.ajax.url(url).load();
  },
  load: function (gridId) {
    var scriptGroupCode = $("#scriptGroupList").val();
    mv_nowScriptGroupCode = scriptGroupCode;

    mv_scriptGridParam = new Object();
    mv_scriptGridParam = {
      mapperName: "script.selectScriptList",
      scriptGroupCode: scriptGroupCode,
    };
    var columns = [
      { title: "스크립트 ID", data: "SCT_CODE", width: "100px", className: "dt-center", defaultContent: "", visible: false },
      {
        title: "",
        data: "",
        width: "3px",
        className: "dt-center",
        defaultContent: "",
        visible: true,
        render: function () {
          return '<button class="ui_btn_icon_image icon_updown_arrow"></button>';
        },
      },
      { title: "순번", data: "SCT_RN", width: "80px", className: "dt-center", defaultContent: "", visible: true },
      { title: "스크립트 제목", data: "SCT_NM", width: "100%", className: "dt-left", defaultContent: "", visible: true },
      {
        title: "",
        data: "",
        width: "100%",
        className: "dt-left",
        defaultContent: "",
        visible: true,
        render: function () {
          return '<button class="btnScriptSubMenu ui_btn_icon_image icon_submenu"></button>';
        },
      },
    ];
    var options = {
      responsive: true,
      retrieve: true,
      pagingType: "full_numbers",
      autoWidth: 1920, // 컬럼 자동 사이즈 조절
      autoHeight: false, // 로우 수에 맞게 상하 자동 조절
      scrollX: true, // 좌우 스크롤 사용 여부(true/false) / 고정 된 좌우 길이값(300px)
      scrollY: "auto", // 상하 스크롤 사용 여부(true/false) / 고정된 상하 길이값(300px) / "auto"
      ordering: false, // 헤더 셀 선택 시 선택 된 셀 기준으로 order by 처리
      searching: true, // 텍스트 검색 활성화 여부, serverSide가 true일 경우 조회 된 내용 중에서만 검색한다.
      info: false, // 조회 건 수 표시 여부
      paginate: false, // 페이징 활성화 여부
      lengthChange: false, // 출력 할 Row 설정 여부
      dom: '<"top"f>rt', // 화면 그리는순서 설정 [ rt: 그리드 / <"top"파라미터>: 상단위치 / <"bottom"파라미터>: 하단위치 / <"clear">: 띄우기 / 파라미터 - B:버튼 f:검색 l:조회갯수 i:조회건수 p:페이징 ]
      buttons: [],
      processing: true, // 로딩표시 활성화 여부 true/false
      language: {
        processing: '<div class="dt-loading"><i class="dt-loading-spiner"></i></div>',
      },
      serverSide: true, // 쿼리를 통한 페이징 처리 활성화 여부
      sAjaxSource: gv_contextInfo.contextPath + "/selectGridData.do",
      sServerMethod: "POST",
      fnServerParams: function (aoData) {
        for (var key in mv_scriptGridParam) {
          var item = key;
          var value = mv_scriptGridParam[key];
          aoData.push({ name: item, value: value });
        }
      },
      rowReorder: {
        selector: "td:nth-child(1)", // 순번을 드래그 해야만 순서변경가능
        update: false, // default: true, 순서변경 후 data는 업데이트 되지만 원래 자리로 되돌아옴
        dataSrc: "SCT_ORDER",
      },
      columns: columns,
    };

    mv_scriptGridObj = $(gridId)
      .on("preXhr.dt", function (e, settings, data) {
        // ajax 로드 전

        dtGridHeightResize(gridId, -44); // 그리드 오토 리사이즈
      })
      .on("xhr.dt", function (e, settings, len) {
        // ajax 로드 후
      })
      .on("page.dt", function () {
        dtClearPosTop(gridId); // 페이징 처리 시 스크롤 상단으로 이동
      })
      .on("init.dt", function () {
        // 전체 완료 후

        dtRowSelected(gridId);
        dtGridHeightResize(gridId, -44); // 그리드 오토 리사이즈
        mfn_scriptGrid.event(gridId);
      })
      .on("row-reorder.dt", function (e, diff, edit) {
        // 그리드 드래그앤드랍
        var dataArray = [];
        for (var i = 0, ien = diff.length; i < ien; i++) {
          var oldDataOrder = diff[i].oldData;
          var newDataOrder = diff[i].newData;
          var data = {
            oldData: oldDataOrder,
            newData: newDataOrder,
          };
          dataArray.push(data);
        }
        dataArray.push({ scriptType: mv_nowScriptType });

        var onevent = function (isSuccess, data) {
          // 변경 된 순서로 리로드
          mfn_scriptGrid.reload();
        };

        var params = {
          dataArray: dataArray,
        };

        if (diff.length != 0) {
          // 드래그 앤 드랍 위치가 같을 경우 이벤트방지
          gfn_ajaxJson("/orderSwitchScript.do", "POST", params, true, onevent);
        }
      })
      .DataTable(options);
  },
  event: function (gridId) {
    var $grid = $(gridId);

    // 로우데이터 클릭 이벤트
    $grid.find("tbody").on("click", "td", function () {
      if ($(this).find("input").length > 0) return false;
      if ($(this).find("button").length > 0) return false;

      var rd = mv_scriptGridObj.row(this).data();

      mv_nowScriptIndex = mv_scriptGridObj.row(this).index();
      mv_nowScriptData = rd;
      mv_nowScriptType = "C";

      mv_fileId = gfn_isEmpty(rd.FILE_ID) ? "" : rd.FILE_ID;

      var scriptCode = mv_nowScriptData.SCT_CODE;

      mfn_contentList.load(scriptCode);
    });

    $grid.find("tbody").on("click", "td .btnScriptSubMenu", function () {
      var rd = mv_scriptGridObj.row(this.parentElement).data();
      mv_nowScriptData = rd;
      mfn_openScriptSubMenu(this, rd);
    });
  },
};

//프로덕트 그리드 객체 정보
var mv_productGridObj = null;
var mv_productGridParam;
var mfn_productGrid = {
  reload: function () {
    mv_productGridParma = new Object();
    mv_productGridParam = {
      mapperName: "product.selectProductList",
      scriptGroupCode: mv_nowScriptGroupCode,
    };
    var url = gv_contextInfo.contextPath + "/selectGridData.do";
    mv_productGridObj.ajax.url(url).load();
  },
  load: function (gridId) {
    var scriptGroupCode = $("#scriptGroupList").val();
    mv_nowScriptGroupCode = scriptGroupCode;

    mv_productGridParam = new Object();
    mv_productGridParam = {
      mapperName: "product.selectProductList",
      scriptGroupCode: scriptGroupCode,
    };
    var columns = [
      { title: "상품 ID", data: "PRD_CODE", width: "100px", className: "dt-center", defaultContent: "", visible: false },
      {
        title: "",
        data: "",
        width: "3px",
        className: "dt-center",
        defaultContent: "",
        visible: true,
        render: function () {
          return '<button class="ui_btn_icon_image icon_updown_arrow"></button>';
        },
      },
      { title: "순번", data: "PRD_RN", width: "80px", className: "dt-center", defaultContent: "", visible: true },
      { title: "상품 이름", data: "PRD_NM", width: "100%", className: "dt-left", defaultContent: "", visible: true },
      {
        title: "",
        data: "",
        width: "100%",
        className: "dt-left",
        defaultContent: "",
        visible: true,
        render: function () {
          return '<button class="btnScriptSubMenu ui_btn_icon_image icon_submenu"></button>';
        },
      },
    ];
    var options = {
      responsive: true,
      retrieve: true,
      pagingType: "full_numbers",
      autoWidth: 1920, // 컬럼 자동 사이즈 조절
      autoHeight: false, // 로우 수에 맞게 상하 자동 조절
      scrollX: true, // 좌우 스크롤 사용 여부(true/false) / 고정 된 좌우 길이값(300px)
      scrollY: "auto", // 상하 스크롤 사용 여부(true/false) / 고정된 상하 길이값(300px) / "auto"
      ordering: false, // 헤더 셀 선택 시 선택 된 셀 기준으로 order by 처리
      searching: true, // 텍스트 검색 활성화 여부, serverSide가 true일 경우 조회 된 내용 중에서만 검색한다.
      info: false, // 조회 건 수 표시 여부
      paginate: false, // 페이징 활성화 여부
      lengthChange: false, // 출력 할 Row 설정 여부
      dom: '<"top"f>rt', // 화면 그리는순서 설정 [ rt: 그리드 / <"top"파라미터>: 상단위치 / <"bottom"파라미터>: 하단위치 / <"clear">: 띄우기 / 파라미터 - B:버튼 f:검색 l:조회갯수 i:조회건수 p:페이징 ]
      buttons: [],
      processing: true, // 로딩표시 활성화 여부 true/false
      language: {
        processing: '<div class="dt-loading"><i class="dt-loading-spiner"></i></div>',
      },
      serverSide: true, // 쿼리를 통한 페이징 처리 활성화 여부
      sAjaxSource: gv_contextInfo.contextPath + "/selectGridData.do",
      sServerMethod: "POST",
      fnServerParams: function (aoData) {
        for (var key in mv_productGridParam) {
          var item = key;
          var value = mv_productGridParam[key];
          aoData.push({ name: item, value: value });
        }
      },
      rowReorder: {
        selector: "td:nth-child(1)", // 순번을 드래그 해야만 순서변경가능
        update: false, // default: true, 순서변경 후 data는 업데이트 되지만 원래 자리로 되돌아옴
        dataSrc: "PRD_ORDER",
      },
      columns: columns,
    };

    mv_productGridObj = $(gridId)
      .on("preXhr.dt", function (e, settings, data) {
        // ajax 로드 전

        dtGridHeightResize(gridId, -44); // 그리드 오토 리사이즈
      })
      .on("xhr.dt", function (e, settings, len) {
        // ajax 로드 후
      })
      .on("page.dt", function () {
        dtClearPosTop(gridId); // 페이징 처리 시 스크롤 상단으로 이동
      })
      .on("init.dt", function () {
        // 전체 완료 후

        dtRowSelected(gridId);
        dtGridHeightResize(gridId, -44); // 그리드 오토 리사이즈
        mfn_productGrid.event(gridId);
      })
      .on("row-reorder.dt", function (e, diff, edit) {
        // 그리드 드래그앤드랍
        var dataArray = [];
        for (var i = 0, ien = diff.length; i < ien; i++) {
          var oldDataOrder = diff[i].oldData;
          var newDataOrder = diff[i].newData;
          var data = {
            oldData: oldDataOrder,
            newData: newDataOrder,
          };
          dataArray.push(data);
        }
        dataArray.push({ scriptType: mv_nowScriptType });

        var onevent = function (isSuccess, data) {
          // 변경 된 순서로 리로드
          mfn_productGrid.reload();
        };

        var params = {
          dataArray: dataArray,
        };
        if (diff.length != 0) {
          // 드래그 앤 드랍 위치가 같을 경우 이벤트방지
          gfn_ajaxJson("/orderSwitchScript.do", "POST", params, true, onevent);
        }
      })
      .DataTable(options);
  },
  event: function (gridId) {
    var $grid = $(gridId);

    // 로우데이터 클릭 이벤트
    $grid.find("tbody").on("click", "td", function () {
      if ($(this).find("input").length > 0) return false;
      if ($(this).find("button").length > 0) return false;

      var rd = mv_productGridObj.row(this).data();

      mv_nowScriptIndex = mv_productGridObj.row(this).index();
      mv_nowScriptData = rd;
      mv_nowScriptType = "P";

      mv_fileId = gfn_isEmpty(rd.FILE_ID) ? "" : rd.FILE_ID;

      var productCode = mv_nowScriptData.PRD_CODE_A;

      mfn_contentList.load(productCode);
    });

    $grid.find("tbody").on("click", "td .btnScriptSubMenu", function () {
      var rd = mv_productGridObj.row(this.parentElement).data();
      mv_nowScriptData = rd;
      mfn_openScriptSubMenu(this, rd);
    });
  },
};

function mfn_openScriptSubMenu(_this, rd) {
  var $target = $(_this);

  $(".gridSubMenu").remove();

  var htmlStr = "";
  htmlStr += '<div class="gridSubMenu grid_sub_menu">';
  htmlStr += '<ul class="sub_menu_list">';
  htmlStr += '<li class="btnModifyScriptEdit">정보 수정</li>';
  htmlStr += '<li class="btnCopyScript">복제</li>';
  htmlStr += '<li class="btnRemoveScript">삭제</li>';
  htmlStr += "</ul>";
  htmlStr += "</div>";

  $target.after(htmlStr);

  function closeSubMenu() {
    $(".gridSubMenu").remove();
  }

  $("body").on("click", function () {
    closeSubMenu();
  });

  $(".btnModifyScriptEdit").on("click", function () {
    closeSubMenu();

    mfn_setScriptPopup.read();
    mfn_setScriptPopup.load(rd);

    openModal("#popupScriptEdit");
  });

  $(".btnCopyScript").on("click", function () {
    closeSubMenu();

    var scriptCode = rd.SCT_CODE || rd.PRD_CODE_A;
    var scriptName = rd.SCT_NM || rd.PRD_NM;

    gfn_confirm("선택한 스크립트를 복사하시겠습니까?", function () {
      var onevent = function (isSuccess, data) {
        mfn_scriptGrid.reload();
        mfn_productGrid.reload();
      };

      var params = {
        scriptGroupCode: mv_nowScriptGroupCode,
        scriptCode: scriptCode,
        scriptName: scriptName,
      };

      var url = mv_nowScriptType == "C" ? "/copyScriptInfo.do" : "/copyProductInfo.do";

      gfn_ajax(url, "POST", params, true, onevent);
    });
  });

  $(".btnRemoveScript").on("click", function () {
    closeSubMenu();

    gfn_confirm("스크립트 정보를 삭제하시겠습니까?", function () {
      crudScript.remove(rd);
    });
  });
}

// 선택 된 컨텐츠 정보
var mv_nowContentList = [];
var mv_nowContentData = {};
var mfn_contentList = {
  load: function (scriptCode) {
    var onevent = function (isSuccess, data) {
      var $contentView = $("#contentView");
      $contentView.html("");

      mv_nowContentList = [];
      mv_nowContentData = {};

      var htmlStr = "";
      if (isSuccess) {
        var resultMaps = data.resultMap;
        var resultLength = resultMaps.length;
        if (resultLength > 0) {
          htmlStr += '<div class="content_files_wrap">';
          htmlStr += "<label>첨부파일</label>";

          htmlStr += '<div id="contentFileList" class="content_files"></div>';
          htmlStr += '<button class="btn_file_upload" onclick="onclickUploadFile(this)" data-script-code="' + scriptCode + '">파일 업로드</button>';

          htmlStr += "</div>";

          htmlStr += '<div id="contentList" class="content_list" data-script-code="' + scriptCode + '" >';

          for (var i = 0; i < resultLength; i++) {
            var index = i;
            var resultMap = resultMaps[index];

            var contentCode = gfn_isEmpty(resultMap.CONT_CODE) ? "" : resultMap.CONT_CODE;
            var contentOrder = gfn_isEmpty(resultMap.CONT_ORDER) ? "" : resultMap.CONT_ORDER;
            var contentTitle = gfn_isEmpty(resultMap.CONT_NM) ? "" : resultMap.CONT_NM;
            var contentBody = gfn_isEmpty(resultMap.CONT_BODY) ? "" : resultMap.CONT_BODY;
            var contentNote = gfn_isEmpty(resultMap.CONT_NOTE) ? "" : resultMap.CONT_NOTE;
            //						var contentRownum = gfn_isEmpty(resultMap.CONT_RN) ? "" : resultMap.CONT_RN;

            var ttsFileId = gfn_isEmpty(resultMap.TTS_FILE_ID) ? "" : resultMap.TTS_FILE_ID;
            var ttsMode = gfn_isEmpty(resultMap.TTS_MODE) ? "" : resultMap.TTS_MODE;
            var ttsUseYn = gfn_isEmpty(resultMap.TTS_USE_YN) ? "" : resultMap.TTS_USE_YN;
            var ttsVendor = gfn_isEmpty(resultMap.TTS_VENDOR) ? "" : resultMap.TTS_VENDOR;
            var ttsVoice = gfn_isEmpty(resultMap.TTS_VOICE) ? "" : resultMap.TTS_VOICE;

            mv_nowContentList[contentCode] = resultMap;

            htmlStr += '<div class="contentItem content_item" mode="VIEW" data-index="' + index + '" data-script-code="' + scriptCode + '" data-content-code="' + contentCode + '" data-content-order="' + contentOrder + '">';

            // 조회 화면
            htmlStr += '<div class="content_item_header">';
            htmlStr += '<p class="item_label">단락 제목</p>';
            htmlStr += '<p class="item_input">' + contentTitle + "</p>";
            htmlStr += '<div class="content_item_header_btn">';
            if (resultLength > 1) {
              htmlStr += '<button onclick="onclickChangeOrderUp(this);" class="ui_btn_icon_image icon_up_arrow" data-content-code="' + contentCode + '"></button>';
              htmlStr += '<button onclick="onclickChangeOrderDown(this);" class="ui_btn_icon_image icon_down_arrow" data-content-code="' + contentCode + '"></button>';
            }
            htmlStr += '<button onclick="onclickUpdateContentView(this);" class="ui_btn_icon_image icon_edit" data-content-code="' + contentCode + '"></button>';
            htmlStr += '<button onclick="onclickRemoveContentView(this);" class="ui_btn_icon_image icon_trash" data-content-code="' + contentCode + '"></button>';
            htmlStr += "</div>";
            htmlStr += "</div>";

            if (ttsUseYn == "Y") {
              htmlStr += '<div class="content_item_body ttsIndex' + i + '">';
              htmlStr += "</div>";

              setPlayer(contentCode, i);
            }

            htmlStr += '<div class="content_item_body">';
            htmlStr += '<div class="item_textarea">' + contentBody + "</div>";
            htmlStr += "</div>";

            if (!gfn_isEmpty(contentNote)) {
              htmlStr += '<div class="content_item_note">';
              htmlStr += '<p class="item_label">행동지침 가이드</p>';
              htmlStr += '<p class="item_input">' + contentNote + "</p>";
              htmlStr += "</div>";
            }

            htmlStr += "</div>";
          }
          htmlStr += "</div>";

          htmlStr += '<div class="content_bottom">';
          htmlStr += '<button onclick="onclickRegistContentView(this);" id="btnAddContent" class="btn_add_content" data-script-code="' + scriptCode + '">단락 추가</button>';
          htmlStr += "</div>";

          // 부드럽게 출력 1000 => 1초
          $contentView.fadeOut(0, function () {
            $(this).html(htmlStr).fadeIn(500);
            onloadFileList();
          });
        } else {
          setContentView("EMPTY");
        }
      } else {
        setContentView("EMPTY");
      }
    };
    var params = {
      scriptCode: scriptCode,
    };

    var url = mv_nowScriptType == "C" ? "/selectScriptContentList.do" : "/selectProductContentList.do";

    gfn_ajax(url, "POST", params, true, onevent);
  },
};

var mfn_contentView = {
  init: function (contentCode) {
    $("#btnAddContent").show();

    var resultMap = mv_nowContentData;
    var contentOrder = gfn_isEmpty(resultMap.CONT_ORDER) ? "" : resultMap.CONT_ORDER;
    var contentTitle = gfn_isEmpty(resultMap.CONT_NM) ? "" : resultMap.CONT_NM;
    var contentBody = gfn_isEmpty(resultMap.CONT_BODY) ? "" : resultMap.CONT_BODY;
    var contentNote = gfn_isEmpty(resultMap.CONT_NOTE) ? "" : resultMap.CONT_NOTE;

    var ttsUseYn = gfn_isEmpty(resultMap.TTS_USE_YN) ? "" : resultMap.TTS_USE_YN;

    var $body = $('.contentItem[data-content-code="' + contentCode + '"]');

    var htmlStr = "";

    // 조회 화면
    htmlStr += '<div class="content_item_header">';
    htmlStr += '<p class="item_label">단락 제목</p>';
    htmlStr += '<p class="item_input">' + contentTitle + "</p>";
    htmlStr += '<div class="content_item_header_btn">';
    htmlStr += '<button onclick="onclickChangeOrderUp(this);" class="ui_btn_icon_image icon_up_arrow" data-content-code="' + contentCode + '"></button>';
    htmlStr += '<button onclick="onclickChangeOrderDown(this);" class="ui_btn_icon_image icon_down_arrow" data-content-code="' + contentCode + '"></button>';
    htmlStr += '<button onclick="onclickUpdateContentView(this);" class="ui_btn_icon_image icon_edit" data-content-code="' + contentCode + '"></button>';
    htmlStr += '<button onclick="onclickRemoveContentView(this);" class="ui_btn_icon_image icon_trash" data-content-code="' + contentCode + '"></button>';
    htmlStr += "</div>";
    htmlStr += "</div>";

    if (ttsUseYn == "Y") {
      htmlStr += '<div class="content_item_body ttsIndex' + contentOrder + '">';
      htmlStr += "</div>";

      setPlayer(contentCode, contentOrder);
    }

    htmlStr += '<div class="content_item_body">';
    htmlStr += '<div class="item_textarea">' + contentBody + "</div>";
    htmlStr += "</div>";

    if (!gfn_isEmpty(contentNote)) {
      htmlStr += '<div class="content_item_note">';
      htmlStr += '<p class="item_label">행동지침 가이드</p>';
      htmlStr += '<p class="item_input">' + contentNote + "</p>";
      htmlStr += "</div>";
    }

    $body.fadeOut(0, function () {
      $(this).html(htmlStr).fadeIn(500);
    });
    $body.attr("mode", "VIEW");

    mv_nowContentData = {};
  },
  regist: function () {
    $("#btnAddContent").hide();

    var scriptCode = mv_nowScriptData.SCT_CODE || mv_nowScriptData.PRD_CODE_A;

    if ($("#contentList").length == 0) {
      $("#contentView").html('<div id="contentList" class="content_list" data-script-code="' + scriptCode + '"></div>');
    }

    var $body = $("#contentList");
    var htmlStr = "";

    htmlStr += '<div class="contentItem content_item" mode="REGIST" data-script-code="' + scriptCode + '">';

    // 입력 화면
    htmlStr += '<div class="content_item_toolkit">';
    htmlStr += '<button onclick="onclickRegistCancle(this);" class="btn_toolkit" data-script-code="' + scriptCode + '">취소</button>';
    htmlStr += '<button onclick="onclickRegistContent(this);" class="btn_toolkit" data-script-code="' + scriptCode + '">입력 완료</button>';
    htmlStr += "</div>";

    htmlStr += '<div class="content_item_header">';
    htmlStr += '<p class="item_label">단락 제목</p>';
    htmlStr += '<input class="contentTitle item_input" type="text" placeholder="제목을 입력해주세요." autocomplete="false"/>';
    htmlStr += "</div>";

    htmlStr += '<div class="content_item_body">';
    htmlStr += '<p class="item_label_full">단락 내용</p>';
    htmlStr += '<div class="content_editor_wrap">';
    htmlStr += '<textarea id="contentEditor" class="contentEditor item_textarea"></textarea>';
    htmlStr += "</div>";
    htmlStr += "</div>";

    htmlStr += '<div class="content_item_body">';
    htmlStr += '<p class="item_label_full">행동지침 가이드</p>';
    htmlStr += '<textarea class="contentNote item_textarea_sub" type="text"></textarea>';
    htmlStr += "</div>";

    htmlStr += '<div class="content_item_body">';
    htmlStr += '<p class="item_label_full">TTS</p>';

    htmlStr += '<div class="content_tts_item">';
    htmlStr += '<label class="switch" style="margin:0 auto;">';
    htmlStr += '<input class="ttsUseYn switch-input" type="checkbox"/>';
    htmlStr += '<span class="switch-label" data-on="ON" data-off="Off"></span>';
    htmlStr += '<span class="switch-handle"></span></label>';
    htmlStr += "</div>";

    htmlStr += '<div class="content_tts_item">';
    htmlStr += '<label class="tts_item_label">TTS 벤더</label>';
    htmlStr += '<select class="tts_item_option ttsVendor" disabled>';
    htmlStr += '<option value="">미사용</option>';
    htmlStr += '<option value="VW">보이스웨어</option>';
    htmlStr += "</select>";
    htmlStr += "</div>";

    htmlStr += '<div class="content_tts_item">';
    htmlStr += '<label class="tts_item_label">TTS 모드</label>';
    htmlStr += '<select class="tts_item_option ttsMode" disabled>';
    htmlStr += '<option value="N">미사용</option>';
    htmlStr += '<option value="Y">배치</option>';
    htmlStr += '<option value="L">실시간</option>';
    htmlStr += "</select>";
    htmlStr += "</div>";

    htmlStr += '<div class="content_tts_item">';
    htmlStr += '<label class="tts_item_label">목소리</label>';
    htmlStr += '<select class="tts_item_option ttsVoice" disabled>';
    //			htmlStr += '<option value="3">[남] 준우</option>';
    //			htmlStr += '<option value="8">[여] 수진</option>';
    //			htmlStr += '<option value="10">[여] 유미</option>';
    //			htmlStr += '<option value="11">[여] 규리</option>';
    //			htmlStr += '<option value="12">[여] 다영</option>';
    //			htmlStr += '<option value="13">[여] 초롱</option>';
    //			htmlStr += '<option value="14">[여] 혜련</option>';
    //			htmlStr += '<option value="15">[여] 현아</option>';
    //			htmlStr += '<option value="17">[여] 지민</option>';
    //			htmlStr += '<option value="18">[남] 지훈</option>';
    htmlStr += '<option value="19">[여] 세라</option>';
    //			htmlStr += '<option value="20">[여] 유라</option>';
    //			htmlStr += '<option value="21">[남] 마루</option>';
    htmlStr += "</select>";
    htmlStr += "</div>";
    htmlStr += "</div>";

    htmlStr += "</div>";

    $body.append(htmlStr).fadeIn(500);

    // 사용 여부 활성화 처리
    $body.find(".ttsUseYn").on("change", function () {
      var $this = $(this);

      if ($this.prop("checked")) {
        $body.find(".ttsVendor").prop("disabled", false);
        $body.find(".ttsMode").prop("disabled", false);
        $body.find(".ttsVoice").prop("disabled", false);
      } else {
        $body.find(".ttsVendor").prop("disabled", true);
        $body.find(".ttsMode").prop("disabled", true);
        $body.find(".ttsVoice").prop("disabled", true);

        $body.find(".ttsVendor").find("option:eq(0)").prop("selected", true);
        $body.find(".ttsMode").find("option:eq(0)").prop("selected", true);
        $body.find(".ttsVoice").find("option:eq(0)").prop("selected", true);
      }
    });

    onloadEditor();

    $body.last(".contentItem").find(".contentTitle").focus();
  },
  update: function (contentCode) {
    if ($('.contentItem[mode="REGIST"]').length > 0) {
      gfn_alert("입력 중인 단락을 완료 후 진행 해주세요.");
    } else if ($('.contentItem[mode="EDIT"]').length > 0) {
      gfn_alert("수정 중인 단락을 완료 후 진행 해주세요.");
    } else {
      var onevent = function (isSuccess, data) {
        if (isSuccess) {
          $("#btnAddContent").hide();

          var resultMap = data.resultMap;
          var contentOrder = gfn_isEmpty(resultMap.CONT_ORDER) ? "" : resultMap.CONT_ORDER;
          var contentTitle = gfn_isEmpty(resultMap.CONT_NM) ? "" : resultMap.CONT_NM;
          var contentBody = gfn_isEmpty(resultMap.CONT_BODY) ? "" : resultMap.CONT_BODY;
          var contentNote = gfn_isEmpty(resultMap.CONT_NOTE) ? "" : resultMap.CONT_NOTE;

          var ttsFileId = gfn_isEmpty(resultMap.TTS_FILE_ID) ? "" : resultMap.TTS_FILE_ID;
          var ttsMode = gfn_isEmpty(resultMap.TTS_MODE) ? "" : resultMap.TTS_MODE;
          var ttsUseYn = gfn_isEmpty(resultMap.TTS_USE_YN) ? "" : resultMap.TTS_USE_YN;
          var ttsVendor = gfn_isEmpty(resultMap.TTS_VENDOR) ? "" : resultMap.TTS_VENDOR;
          var ttsVoice = gfn_isEmpty(resultMap.TTS_VOICE) ? "" : resultMap.TTS_VOICE;

          mv_nowContentData = resultMap;

          var $body = $('.contentItem[data-content-code="' + contentCode + '"]');

          var htmlStr = "";

          // 입력 화면
          htmlStr += '<div class="content_item_toolkit">';
          htmlStr += '<button onclick="onclickUpdateCancle(this)" class="btn_toolkit" data-content-code="' + contentCode + '">취소</button>';
          htmlStr += '<button onclick="onclickUpdateContent(this)" class="btn_toolkit" data-content-code="' + contentCode + '">수정 완료</button>';
          htmlStr += "</div>";

          htmlStr += '<div class="content_item_header">';
          htmlStr += '<p class="item_label">단락 제목</p>';
          htmlStr += '<input class="contentTitle item_input" type="text" placeholder="제목을 입력해주세요." autocomplete="false"/>';
          htmlStr += "</div>";

          htmlStr += '<div class="content_item_body">';
          htmlStr += '<p class="item_label_full">단락 내용</p>';
          htmlStr += '<div class="content_editor_wrap">';
          htmlStr += '<textarea id="contentEditor" class="contentEditor item_textarea"></textarea>';
          htmlStr += "</div>";
          htmlStr += "</div>";

          htmlStr += '<div class="content_item_body">';
          htmlStr += '<p class="item_label_full">행동지침 가이드</p>';
          htmlStr += '<textarea class="contentNote item_textarea_sub" type="text"></textarea>';
          htmlStr += "</div>";

          htmlStr += '<div class="content_item_body">';
          htmlStr += '<p class="item_label_full">TTS</p>';

          htmlStr += '<div class="content_tts_item">';
          htmlStr += '<label class="switch" style="margin:0 auto;">';
          htmlStr += '<input class="ttsUseYn switch-input" type="checkbox"/>';
          htmlStr += '<span class="switch-label" data-on="ON" data-off="Off"></span>';
          htmlStr += '<span class="switch-handle"></span></label>';
          htmlStr += "</div>";

          htmlStr += '<div class="content_tts_item">';
          htmlStr += '<label class="tts_item_label ">TTS 벤더</label>';
          htmlStr += '<select class="tts_item_option ttsVendor" disabled>';
          htmlStr += '<option value="">미사용</option>';
          htmlStr += '<option value="VW">보이스웨어</option>';
          htmlStr += "</select>";
          htmlStr += "</div>";

          htmlStr += '<div class="content_tts_item">';
          htmlStr += '<label class="tts_item_label">TTS 모드</label>';
          htmlStr += '<select class="tts_item_option ttsMode" disabled>';
          htmlStr += '<option value="N">미사용</option>';
          htmlStr += '<option value="Y">배치</option>';
          htmlStr += '<option value="L">실시간</option>';
          htmlStr += "</select>";
          htmlStr += "</div>";

          htmlStr += '<div class="content_tts_item">';
          htmlStr += '<label class="tts_item_label">목소리</label>';
          htmlStr += '<select class="tts_item_option ttsVoice" disabled>';
          //						htmlStr += '<option value="3">[남] 준우</option>';
          //						htmlStr += '<option value="8">[여] 수진</option>';
          //						htmlStr += '<option value="10">[여] 유미</option>';
          //						htmlStr += '<option value="11">[여] 규리</option>';
          //						htmlStr += '<option value="12">[여] 다영</option>';
          //						htmlStr += '<option value="13">[여] 초롱</option>';
          //						htmlStr += '<option value="14">[여] 혜련</option>';
          //						htmlStr += '<option value="15">[여] 현아</option>';
          //						htmlStr += '<option value="17">[여] 지민</option>';
          //						htmlStr += '<option value="18">[남] 지훈</option>';
          htmlStr += '<option value="19">[여] 세라</option>';
          //						htmlStr += '<option value="20">[여] 유라</option>';
          //						htmlStr += '<option value="21">[남] 마루</option>';
          htmlStr += "</select>";
          htmlStr += "</div>";
          htmlStr += "</div>";

          $body.fadeOut(0, function () {
            $(this).html(htmlStr).fadeIn(500);
          });
          $body.attr("mode", "EDIT");

          onloadEditor();

          if (ttsUseYn == "Y") {
            $body.find(".ttsUseYn").prop("checked", true);

            $body.find(".ttsVendor").val(ttsVendor).prop("disabled", false);
            $body.find(".ttsMode").val(ttsMode).prop("disabled", false);
            $body.find(".ttsVoice").val(ttsVoice).prop("disabled", false);
          }

          // 사용 여부 활성화 처리
          $body.find(".ttsUseYn").on("change", function () {
            var $this = $(this);

            if ($this.prop("checked")) {
              $body.find(".ttsVendor").prop("disabled", false);
              $body.find(".ttsMode").prop("disabled", false);
              $body.find(".ttsVoice").prop("disabled", false);
            } else {
              $body.find(".ttsVendor").prop("disabled", true);
              $body.find(".ttsMode").prop("disabled", true);
              $body.find(".ttsVoice").prop("disabled", true);

              $body.find(".ttsVendor").find("option:eq(0)").prop("selected", true);
              $body.find(".ttsMode").find("option:eq(0)").prop("selected", true);
              $body.find(".ttsVoice").find("option:eq(0)").prop("selected", true);
            }
          });

          $body.find(".contentTitle").val(contentTitle).focus();
          $body.find(".contentEditor").val(contentBody);
          $body.find(".contentNote").val(contentNote);
        }
      };

      var params = {
        contentCode: contentCode,
      };

      var url = mv_nowScriptType == "C" ? "/selectScriptContent.do" : "/selectProductContent.do";

      gfn_ajax(url, "POST", params, true, onevent);
    }
  },
};
var mfn_setScriptPopup = {
  load: function (data) {
    try {
      if (mv_nowScriptType == "C") {
        $("#scriptCode").val(data.SCT_CODE);
        $("#scriptName").val(data.SCT_NM);
      } else {
        $("#scriptCode").val(data.PRD_CODE_A);
        $("#scriptName").val(data.PRD_NM);
      }
    } catch (e) {}
  },
  read: function () {
    var $pop = $("#popupScriptEdit");
    $pop.find("input").attr("disabled", "disabled");
    $pop.find("select").attr("disabled", "disabled");

    $("#btnModifyScript").show();
    $("#btnInsertScript, #btnUpdateScript").hide();

    initPositionModal("#popupScriptEdit");
  },
  write: function (data) {
    initPositionModal("#popupScriptEdit");

    var $pop = $("#popupScriptEdit");
    $pop.find("input").removeAttr("disabled");
    $pop.find("select").removeAttr("disabled");
    $pop.find("input").val("");

    $pop.find("#scriptName").focus();

    $("#btnModifyScript, #btnUpdateScript").hide();
    $("#btnInsertScript").show();
  },
  modify: function () {
    var $pop = $("#popupScriptEdit");
    $pop.find("input").removeAttr("disabled");
    $pop.find("select").removeAttr("disabled");

    $pop.find("#scriptName").focus();

    $("#btnUpdateScript").show();
    $("#btnInsertScript, #btnModifyScript").hide();
  },
  reset: function () {
    var $pop = $("#popupScriptEdit");
    $pop.find("input").val("");
  },
};

var mv_editor;
function onloadEditor() {
  onloadKeyword();

  // 에디터 객체를 추가 할때마다 CKEDITOR.instances 하위로 추가 된다.
  CKEDITOR.replace("contentEditor", {
    language: "ko", // 언어 설정
    uiColor: "#b9ced3", // 에디터 컬러
    width: "100%", // 가로길이 조절
    height: "300px", // 높이 조절
    on: {
      pluginsLoaded: function () {
        var editor = this;
        var config = editor.config;
        var tagRules = "span{data-target}";

        editor.filter.allow("span[data-item]", "*");
        editor.filter.allow("span[data-target]", "*");

        editor.ui.addRichCombo("myCombo", {
          label: "키워드", // 제목
          title: "", // tooltip
          toolbar: "others", //드롭다운 위치

          allowedContent: tagRules,
          requiredContent: tagRules,

          panel: {
            css: [CKEDITOR.skin.getPath("editor")].concat(config.contentsCss),
            multiSelect: false,
          },

          init: function () {
            //						this.startGroup('사용 할 항목을 선택하세요.'); // Option 그룹명 설정
            for (var i = 0; i < mv_keywordMap.length; i++) {
              var item = mv_keywordMap[i];

              var key = item.CD_KEYWORD;
              var value = item.CD_NM;
              var optionHtml = "<span>" + "[" + key + "] " + value + "</span>";

              var item = key + "!@!@" + value;
              this.add(item, optionHtml); // Option값 추가 (키워드, 드롭다운에 보여질값)
            }
          },
          onClick: function (item) {
            editor.focus();
            editor.fire("saveSnapshot"); // 스냅샷 저장 (앞으로, 뒤로가기)

            var itemArr = item.split("!@!@");
            var key = itemArr[0];
            var value = itemArr[1];

            // 콤보 선택 시, Editor에 표출 될 내용
            var itemStyle = "color: #ffffff; background-color: #2d5161;";

            var optionHtml = '&nbsp;<span data-target="keyword" data-item="' + key + '" style="' + itemStyle + '">&nbsp;Keyword: ' + value + "&nbsp;</span>&nbsp;";
            editor.insertHtml(optionHtml); // 선택한 값 출력

            editor.fire("saveSnapshot");
          },
          refresh: function () {
            //						if( !editor.activeFilter.check( tagRules ) )
            //						{
            //							this.setState( CKEDITOR.TRISTATE_DISABLED );
            //						}
          },
        });
      },
    },
  });

  mv_editor = CKEDITOR.instances.contentEditor;

  // mv_editor.ui.get('myCombo2'); // @TEST : 콤보 정보 가져오기
}

// 스크립트 그룹 전환
function onchangeScriptGroup(_this) {
  var scriptGroupCode = $(_this).val();
  mv_nowScriptGroupCode = scriptGroupCode;

  mfn_scriptGrid.reload();
  mfn_productGrid.reload();
  setContentView("INIT");
}

// 단락 수정모드 전환
function onclickUpdateContentView(_this) {
  var contentCode = $(_this).attr("data-content-code");
  mfn_contentView.update(contentCode);
}

// 단락 입력모드 추가
function onclickRegistContentView(_this) {
  mfn_contentView.regist();
}

// 단락 수정모드 취소
function onclickUpdateCancle(_this) {
  var contentCode = $(_this).attr("data-content-code");
  gfn_confirm("수정을 취소 하시겠습니까?", function () {
    mfn_contentView.init(contentCode);
  });
}

// 단락 입력모드 취소
function onclickRegistCancle(_this) {
  gfn_confirm("단락 작성을 취소 하시겠습니까?", function () {
    // 기존에 작성 된 스크립트가 없으면 컨텐츠 리스트 재조회
    if ($('.contentItem[mode="VIEW"]').length == 0) {
      mfn_contentList.load(mv_nowScriptData.SCT_CODE);
    }

    $('.contentItem[mode="REGIST"]').remove();
    $("#btnAddContent").show();
  });
}

// 단락 삭제
function onclickRemoveContentView(_this) {
  var contentCode = $(_this).attr("data-content-code");
  gfn_confirm("단락을 삭제 하시겠습니까?", function () {
    crudContent.remove(contentCode);
  });
}

// 단락 수정 완료
function onclickUpdateContent(_this) {
  gfn_confirm("단락 내용을 수정 하시겠습니까?", function () {
    crudContent.update();
  });
}

// 단락 입력 완료
function onclickRegistContent(_this) {
  gfn_confirm("신규 단락을 추가 하시겠습니까?", function () {
    crudContent.insert();
  });
}

// 단락 업로드
function onclickUploadContent(_this) {
  // 로딩화면 숨김
  $(".loading-overlay").hide();
  openModal("#popupUploadContent");
}

// 파일 업로드
function onclickUploadFile(_this) {
  openModal("#popupUploadFile");
}

// 파일 다운로드
function onclickDownloadFile(_this) {
  var fileUuid = $(_this).attr("data-file-uuid");
  gfn_confirm("파일을 다운로드 하시겠습니까?", function () {
    crudFile.downloadFile(fileUuid);
  });
}

// 파일 삭제
function onclickRemoveFile(_this) {
  var fileId = $(_this).attr("data-file-id");
  var fileUuid = $(_this).attr("data-file-uuid");
  gfn_confirm("파일을 삭제 하시겠습니까?", function () {
    crudFile.removeFile(fileId, fileUuid);
  });
}

// 게시글 하나 위로
function onclickChangeOrderUp(_this) {
  var scriptCode = "";

  if (mv_nowScriptType == "C") {
    scriptCode = mv_nowScriptData.SCT_CODE;
  } else {
    scriptCode = mv_nowScriptData.PRD_CODE_A;
  }

  // 이벤트 대상 단락
  var contentCode = $(_this).attr("data-content-code");

  var $item = $('.contentItem[data-content-code="' + contentCode + '"]');
  var contentIndex = $item.attr("data-index");
  var contentOrder = $item.attr("data-content-order");

  var compareIndex = Number(contentIndex) - 1;
  var $target = $('.contentItem[data-index="' + compareIndex + '"]');

  if ($target.length > 0) {
    // 변경할 대상 단락
    var willChangeContentCode = $target.attr("data-content-code");
    var willChangeOrder = $target.attr("data-content-order");

    var onevent = function (isSuccess, data) {
      // UI 상 순서변경
      $item.fadeOut(0);
      $target.fadeOut(0, function () {
        $(this).before($item).fadeIn(500);
        $item.fadeIn(500);
      });

      // 데이터 재정렬
      $item.attr("data-content-order", willChangeOrder);
      $target.attr("data-content-order", contentOrder);

      $(".contentItem").each(function (i) {
        $(this).attr("data-index", i + 1);
      });
    };
    var params = {
      scriptType: mv_nowScriptType,
      scriptCode: scriptCode,
      contentCode: contentCode,
      contentOrder: contentOrder,
      willChangeContentCode: willChangeContentCode,
      willChangeOrder: willChangeOrder,
    };
    gfn_ajax("/orderSwitchContent.do", "POST", params, true, onevent);
  }
}

// 게시글 하나 아래로
function onclickChangeOrderDown(_this) {
  var scriptCode = "";

  if (mv_nowScriptType == "C") {
    scriptCode = mv_nowScriptData.SCT_CODE;
  } else {
    scriptCode = mv_nowScriptData.PRD_CODE_A;
  }
  // 이벤트 대상 단락
  var contentCode = $(_this).attr("data-content-code");

  var $item = $('.contentItem[data-content-code="' + contentCode + '"]');
  var contentIndex = $item.attr("data-index");
  var contentOrder = $item.attr("data-content-order");

  var compareIndex = Number(contentIndex) + 1;
  var $target = $('.contentItem[data-index="' + compareIndex + '"]');

  if ($target.length > 0) {
    // 변경할 대상 단락
    var willChangeContentCode = $target.attr("data-content-code");
    var willChangeOrder = $target.attr("data-content-order");

    var onevent = function (isSuccss, data) {
      // UI 상 순서변경
      $item.fadeOut(0);
      $target.fadeOut(0, function () {
        $(this).after($item).fadeIn(500);
        $item.fadeIn(500);
      });

      // 데이터 재정렬
      $item.attr("data-content-order", willChangeOrder);
      $target.attr("data-content-order", contentOrder);

      $(".contentItem").each(function (i) {
        $(this).attr("data-index", i + 1);
      });
    };
    var params = {
      scriptType: mv_nowScriptType,
      scriptCode: scriptCode,
      contentCode: contentCode,
      contentOrder: contentOrder,
      willChangeContentCode: willChangeContentCode,
      willChangeOrder: willChangeOrder,
    };
    gfn_ajax("/orderSwitchContent.do", "POST", params, true, onevent);
  }
}

var crudScript = {
  insert: function () {
    var $body = $("#popupScriptEdit");

    var scriptGroupCode = mv_nowScriptGroupCode;
    var scriptName = $body.find("#scriptName").val().trim();

    var isPass = true;

    if (isPass && gfn_isEmpty(scriptName)) {
      gfn_alert("스크립트 제목을 입력해주세요");
      $("#scriptName").focus();
      isPass = false;
    }

    if (isPass) {
      var onevent = function (isSuccess, data) {
        gfn_alert("스크립트 정보가 추가되었습니다.");
        closeModal("#popupScriptEdit");

        mfn_setScriptPopup.reset();
        mfn_scriptGrid.reload();
        mfn_productGrid.reload();
      };

      var params = {
        scriptGroupCode: scriptGroupCode,
        scriptName: scriptName,
      };

      var url = mv_nowScriptType == "C" ? "/insertScriptInfo.do" : "/insertProductInfo.do";

      gfn_ajax(url, "POST", params, true, onevent);
    }
  },
  update: function () {
    var $body = $("#popupScriptEdit");

    var scriptGroupCode = mv_nowScriptGroupCode;
    var scriptCode = $body.find("#scriptCode").val().trim();
    var scriptName = $body.find("#scriptName").val().trim();

    var oldScriptName = "";

    if (mv_nowScriptType == "C") {
      oldScriptName = mv_nowScriptData.SCT_NM;
    } else {
      oldScriptName = mv_nowScriptData.PRD_NM;
    }

    var isPass = true;

    if (isPass && gfn_isEmpty(scriptName)) {
      gfn_alert("스크립트 제목을 입력해주세요");
      $("#scriptName").focus();
      isPass = false;
    }

    if (isPass) {
      var onevent = function (isSuccess, data) {
        gfn_alert("스크립트 정보가 수정되었습니다.");
        closeModal("#popupScriptEdit");

        mfn_setScriptPopup.read();
        mfn_scriptGrid.reload();
        mfn_productGrid.reload();
      };

      var params = {
        scriptGroupCode: scriptGroupCode,
        scriptCode: scriptCode,
        scriptName: scriptName,
        oldScriptName: oldScriptName,
      };

      var url = mv_nowScriptType == "C" ? "/updateScriptInfo.do" : "/updateProductInfo.do";

      gfn_ajax(url, "POST", params, true, onevent);
    }
  },
  remove: function (rd) {
    var scriptCode = "";
    var scriptName = "";

    if (mv_nowScriptType == "C") {
      scriptCode = rd.SCT_CODE;
      scriptName = rd.SCT_NM;
    } else {
      scriptCode = rd.PRD_CODE_A;
      scriptName = rd.PRD_NM;
    }

    var fileId = rd.FILE_ID;
    var onevent = function (isSuccess, data) {
      gfn_alert("스크립트 정보가 삭제되었습니다.");
      closeModal("#popupScriptEdit");

      mfn_scriptGrid.reload();
      mfn_productGrid.reload();
      setContentView("INIT");
    };
    var params = {
      scriptCode: scriptCode,
      scriptName: scriptName,
      fileId: fileId,
    };

    var url = mv_nowScriptType == "C" ? "/deleteScriptInfo.do" : "/deleteProductInfo.do";

    gfn_ajax(url, "POST", params, true, onevent);
  },
};

var crudContent = {
  insert: function () {
    var $body = $('.contentItem[mode="REGIST"]');

    var value = $("tts_item_option");

    var scriptCode = $body.attr("data-script-code");
    var contentTitle = $body.find(".contentTitle").val().trim();
    var contentBody = mv_editor.getData();
    var contentNote = $body.find(".contentNote").val().trim();

    var isPass = true;
    if (isPass && gfn_isEmpty(contentTitle)) {
      gfn_alert("단락 제목을 작성해주세요.");
      isPass = false;
    }

    if (isPass && gfn_isEmpty(contentBody)) {
      gfn_alert("단락 내용을 작성해주세요.");
      isPass = false;
    }

    var ttsVendor = $body.find(".ttsVendor").val();
    var ttsMode = $body.find(".ttsMode").val();
    var ttsVoice = $body.find(".ttsVoice").val();
    var ttsUseYn = $body.find(".ttsUseYn").prop("checked") ? "Y" : "N";

    if (isPass && ttsUseYn == "Y" && gfn_isEmpty(ttsVendor)) {
      gfn_alert("TTS 벤더를 선택해주세요.");
      isPass = false;
    }

    if (isPass && ttsUseYn == "Y" && gfn_isEmpty(ttsMode) && ttsMode == "N") {
      gfn_alert("TTS 모드를 선택해주세요.");
      isPass = false;
    }

    if (isPass && ttsUseYn == "Y" && gfn_isEmpty(ttsVoice)) {
      gfn_alert("목소를 선택해주세요.");
      isPass = false;
    }

    if (isPass) {
      var params = {
        scriptCode: scriptCode,
        contentTitle: contentTitle,
        contentBody: contentBody,
        contentNote: contentNote,
        ttsVendor: ttsVendor,
        ttsMode: ttsMode,
        ttsVoice: ttsVoice,
        ttsUseYn: ttsUseYn,
      };
      var onevent = function (isSuccess, data) {
        if (isSuccess) {
          var resultCode = data.resultCode;
          var resultCount = data.resultCount;

          if (resultCode == 1) {
            gfn_alert("단락이 추가 되었습니다.");
            mfn_contentList.load(scriptCode);
          } else {
            gfn_alert("단락 추가에 실패 했습니다.");
          }
        }
      };

      var url = mv_nowScriptType == "C" ? "/insertScriptContent.do" : "/insertProductContent.do";

      gfn_ajax(url, "POST", params, true, onevent);
    }
  },
  update: function () {
    var $body = $('.contentItem[mode="EDIT"]');

    var scriptCode = $body.attr("data-script-code");
    var contentCode = $body.attr("data-content-code");
    var contentTitle = $body.find(".contentTitle").val().trim();
    var contentBody = mv_editor.getData();
    var contentNote = $body.find(".contentNote").val().trim();

    var isPass = true;
    if (isPass && gfn_isEmpty(contentTitle)) {
      gfn_alert("단락 제목을 작성해주세요.");
      isPass = false;
    }

    if (isPass && gfn_isEmpty(contentBody)) {
      gfn_alert("단락 내용을 작성해주세요.");
      isPass = false;
    }

    var ttsVendor = $body.find(".ttsVendor").val();
    var ttsMode = $body.find(".ttsMode").val();
    var ttsVoice = $body.find(".ttsVoice").val();
    var ttsUseYn = $body.find(".ttsUseYn").prop("checked") ? "Y" : "N";

    if (isPass && ttsUseYn == "Y" && gfn_isEmpty(ttsVendor)) {
      gfn_alert("TTS 벤더를 선택해주세요.");
      isPass = false;
    }

    if (isPass && ttsUseYn == "Y" && gfn_isEmpty(ttsMode) && ttsMode == "N") {
      gfn_alert("TTS 모드를 선택해주세요.");
      isPass = false;
    }

    if (isPass && ttsUseYn == "Y" && gfn_isEmpty(ttsVoice)) {
      gfn_alert("목소를 선택해주세요.");
      isPass = false;
    }

    if (isPass) {
      var params = {
        scriptCode: scriptCode,
        contentCode: contentCode,
        contentTitle: contentTitle,
        contentBody: contentBody,
        contentNote: contentNote,
        ttsVendor: ttsVendor,
        ttsMode: ttsMode,
        ttsVoice: ttsVoice,
        ttsUseYn: ttsUseYn,
      };

      var onevent = function (isSuccess, data) {
        if (isSuccess) {
          var resultCode = data.resultCode;
          var resultCount = data.resultCount;

          if (resultCode == 1) {
            gfn_alert("단락이 수정 되었습니다.", function () {
              mfn_contentList.load(scriptCode);
            });
          } else {
            gfn_alert("단락 수정에 실패 했습니다.");
          }
        }
      };
      var url = mv_nowScriptType == "C" ? "/updateScriptContent.do" : "/updateProductContent.do";

      gfn_ajax(url, "POST", params, true, onevent);
    }
  },
  remove: function (contentCode) {
    var scriptCode = "";

    if (mv_nowScriptType == "C") {
      scriptCode = mv_nowScriptData.SCT_CODE;
    } else {
      scriptCode = mv_nowScriptData.PRD_CODE_A;
    }

    var onevent = function (isSuccess, data) {
      if (isSuccess) {
        var resultCode = data.resultCode;
        var resultCount = data.resultCount;

        if (resultCode == 1) {
          gfn_alert("단락이 삭제 되었습니다.");
          mfn_contentList.load(scriptCode);
        }
      } else {
        gfn_alert("요청에 실패 했습니다.");
      }
    };

    var params = {
      scriptCode: scriptCode,
      contentCode: contentCode,
    };

    var url = mv_nowScriptType == "C" ? "/deleteScriptContent.do" : "/deleteProductContent.do";

    gfn_ajax(url, "POST", params, true, onevent);
  },
};

var crudFile = {
  downloadFile: function (fileUuid) {
    var params = {
      fileUuid: fileUuid,
    };
    gfn_downloadFrame("/downloadFile.do", params);
  },
  removeFile: function (fileId, fileUuid) {
    var onevent = function (isSuccess, data) {
      if (isSuccess) {
        var resultCode = data.resultCode;
        var resultCount = data.resultCount;

        if (resultCode > 0) {
          gfn_alert("첨부파일이 삭제 되었습니다.");

          $('.uploadedFile[data-file-uuid="' + fileUuid + '"]').remove(); // UI상 제거

          // UI상 모든 파일이 제거 되었으면
          if ($(".uploadedFile").length == 0) {
            var $body = $("#contentFileList");
            var htmlStr = '<p class="empty_files">첨부 된 파일이 없습니다.</p>';
            $body.append(htmlStr);
          }
        } else {
          gfn_alert("첨부파일 삭제에 실패 했습니다.");
        }
      } else {
        gfn_alert("요청에 실패 했습니다.");
      }
    };
    var params = {
      fileId: fileId,
      fileUuid: fileUuid,
    };
    gfn_ajax("/removeFile.do", "POST", params, true, onevent);
  },
};

function onloadFileList() {
  var fileId = mv_fileId;
  var scriptCode = "";
  if (mv_nowScriptType == "C") {
    scriptCode = mv_nowScriptData.SCT_CODE;
  } else {
    scriptCode = mv_nowScriptData.PRD_CODE_A;
  }

  var $body = $("#contentFileList");
  var htmlStr = "";

  if (!gfn_isEmpty(fileId)) {
    var onevent = function (isSuccess, data) {
      if (isSuccess) {
        var resultMaps = data.resultMap;
        var resultLength = resultMaps.length;

        if (resultLength > 0) {
          for (var i = 0; i < resultLength; i++) {
            var resultMap = resultMaps[i];
            var fileName = resultMap.FILE_ORIGIN_NAME;
            var fileSize = resultMap.FILE_SIZE;
            var fileUuid = resultMap.FILE_UUID;

            htmlStr += '<div class="uploadedFile item_files" data-file-id="' + fileId + '" data-file-uuid="' + fileUuid + '">';
            htmlStr += '<span class="file_name" onclick="onclickDownloadFile(this)" data-file-id="' + fileId + '" data-file-uuid="' + fileUuid + '">' + fileName + "</span>";
            htmlStr += '<span class="file_size">( ' + fileSize + " )</span>";
            htmlStr += '<span onclick="onclickRemoveFile(this)" class="file_remove" data-file-id="' + fileId + '" data-file-uuid="' + fileUuid + '"></span>';

            htmlStr += "</div>";
          }
        } else {
          htmlStr = '<p class="empty_files">첨부 된 파일이 없습니다.</p>';
        }
      } else {
        htmlStr = '<p class="empty_files">첨부 된 파일이 없습니다.</p>';
      }

      $body.html(htmlStr);
    };

    var params = {
      fileId: fileId,
    };
    gfn_ajax("/selectFileList.do", "POST", params, true, onevent);
  } else {
    htmlStr = '<p class="empty_files">첨부 된 파일이 없습니다.</p>';
    $body.html(htmlStr);
  }
}

// 키워드 초기화
var mv_keywordMap = [];
function onloadKeyword() {
  mv_keywordMap = [];
  var onevent = function (isSuccess, data) {
    mv_keywordMap = data.resultMap;
  };
  var params = {
    parentCode: "20000",
    useYn: "Y",
  };
  gfn_ajax("/selectKeywordList.do", "POST", params, true, onevent);
}

// Dropzone 이벤트 초기화
var mv_fileDropzone;
var mv_contentDropzone;
var mv_max_file_size = 150; // 파일 크기 제한 MB
var mv_max_files = 20; // 파일 갯수 제한
var mv_accept_files = []; // 허용 확장자
var mv_file_arr = []; // 파일 데이터 배열
var mv_file_length = 0;
function onloadDropzone(type) {
  Dropzone.autoDiscover = false; // 자동 오브젝트 생성 여부

  switch (type) {
    case "FILE":
      {
        var options = {
          url: gv_contextInfo.contextPath + "/uploadFile.do",
          maxFilesize: mv_max_file_size, // 최대 파일크기 MB
          maxFiles: mv_max_files, // 최대 파일 갯수제한
          uploadMultiple: true, // 동시 전송 여부
          parallelUploads: 5, // 동시 전송 파일 갯수
          autoProcessQueue: false, // 드랍이벤트 종료 시 증시 서버로 전송 여부
          createImageThumbnails: false, // 썸네일 이미지 생성 여부
          init: function () {
            mv_fileDropzone = this;
            var files = "";

            // Config
            mv_fileDropzone.options.addRemoveLinks = true;
            mv_fileDropzone.options.dictRemoveFile = "삭제";

            // 파일 업로드 시
            mv_fileDropzone.on("addedfile", function (file) {
              var fileName = file.name;
              var fileArrLength = mv_file_arr.length;
              var fileSize = file.size;

              if (fileArrLength > mv_max_files) {
              } else {
                mv_file_arr.push(file);
              }

              if (fileSize > mv_max_file_size * 1048576) {
                mv_fileDropzone.removeFile(file);
                gfn_alert("용량제한 " + mv_max_file_size + "MB를 초과하였습니다.");
                return false;
              }

              if ($(".dz-preview").length > mv_max_files) {
                mv_fileDropzone.removeFile(file);
                gfn_alert("파일은 " + mv_max_files + "개까지만 첨부할 수 있습니다.");
                return false;
              }
            });

            // 파라미터 전송 시
            mv_fileDropzone.on("sending", function (file, xhr, formData) {
              // 로딩화면 보여짐
              $(".loading-overlay").show();

              var scriptCode = "";
              if (mv_nowScriptType == "C") {
                scriptCode = mv_nowScriptData.SCT_CODE;
              } else {
                scriptCode = mv_nowScriptData.PRD_CODE_A;
              }

              formData.append("file", file);
              formData.append("scriptType", mv_nowScriptType);
              formData.append("scriptCode", scriptCode);

              if (mv_nowScriptData.FILE_ID != null) {
                formData.append("fileId", mv_nowScriptData.FILE_ID);
              }
            });

            // 데이터 통신 성공 후
            mv_fileDropzone.on("success", function (file, responseText) {
              var resultData = new Object();

              try {
                resultData = JSON.parse(responseText);
              } catch (e) {}

              var resultCode = resultData.resultCode;
              var fileName = resultData.fileName;

              mv_fileId = resultData.fileId;

              if (mv_nowScriptType == "C") {
                mv_scriptGridObj.row(mv_nowScriptIndex).data().FILE_ID = mv_fileId; // 현재 조회 중인 그리드 정보 초기화
              } else {
                mv_productGridObj.row(mv_nowScriptIndex).data().FILE_ID = mv_fileId;
              }

              file.previewElement.classList.add("dz-success");
              file.previewElement.classList.remove("dz-error");

              mv_file_length++;
              files = mv_file_arr.length;

              // 파일 갯수 카운트까지 반복한다.
              if (mv_file_length < files) {
                // 전송할 파일이 남아있으면 추가 전송 시작
                mv_fileDropzone.processQueue();
              }
            });

            // 업로드 프로그레스 처리
            mv_fileDropzone.on("totaluploadprogress", function (progress) {
              $(".roller").width(progress + "%");
            });

            // 업로드 완료 시
            mv_fileDropzone.on("queuecomplete", function (progress) {
              gfn_alert("업로드 되었습니다.");

              // 로딩화면 숨김
              $(".loading-overlay").hide();
              $(".meter").delay(999).slideUp(999);

              // 전체 완료 후에 초기화 한다.
              if (mv_file_length == files) {
                onloadFileList();

                $(".dropzone")[0].dropzone.files.forEach(function (file) {
                  file.previewTemplate.remove();
                });
                $(".dropzone").removeClass("dz-started");

                mv_file_length = 0;
                mv_file_arr = [];
              }
            });

            // 파일 삭제 시
            mv_fileDropzone.on("removedfile", function (file) {
              if (mv_file_arr.length > mv_max_files) {
                // 파일 갯수가 초과된 상태의 삭제
                mv_file_arr.splice(mv_max_files, Number.MAX_VALUE);
              } // 삭제 버튼으로 삭제시
              else {
                var fileName = file.name;
              }
            });

            // 파일 제한 갯수 초과시 이벤트
            mv_fileDropzone.on("mv_max_filesexceeded", function (file) {
              mv_fileDropzone.removeFile(file); // dropzone 기능상의 삭제, 폼을 삭제
              gfn_alert("파일은 " + mv_max_files + "개 까지만 첨부할 수 있습니다.");
            });
          },
        };

        $("#uploadFileDropzone").dropzone(options);

        $("#btnFileUpload").on("click", function () {
          if (gfn_isEmpty(mv_file_arr)) {
            gfn_alert("업로드할 파일이 없습니다.");
          } else {
            mv_fileDropzone.processQueue();
          }
        });
      }
      break;
    case "CONTENT":
      {
        var options = {
          url: gv_contextInfo.contextPath + "/uploadContent.do",
          maxFilesize: mv_max_file_size, // 최대 파일크기 MB
          maxFiles: 1, // 최대 파일 갯수제한
          uploadMultiple: false, // 동시 전송 여부
          parallelUploads: 1, // 동시 전송 파일 갯수
          autoProcessQueue: false, // 드랍이벤트 종료 시 증시 서버로 전송 여부
          createImageThumbnails: false, // 썸네일 이미지 생성 여부
          init: function () {
            mv_contentDropzone = this;

            // Config
            mv_contentDropzone.options.addRemoveLinks = true;
            mv_contentDropzone.options.dictRemoveFile = "삭제";

            // 파일 업로드 시
            mv_contentDropzone.on("addedfile", function (file) {
              var fileName = file.name;
              var fileArrLength = mv_file_arr.length;
              var fileSize = file.size;
              var fileType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

              if (fileArrLength > mv_max_files) {
              } else {
                mv_file_arr.push(file);
              }

              if (file.type != fileType) {
                mv_contentDropzone.removeFile(file);
                gfn_alert("Word 파일만 업로드 가능합니다.");
                return false;
              }

              if (fileSize > mv_max_file_size * 1048576) {
                mv_contentDropzone.removeFile(file);
                gfn_alert("용량제한 " + mv_max_file_size + "MB를 초과하였습니다.");
                return false;
              }

              if ($(".dz-preview").length > mv_max_files) {
                mv_contentDropzone.removeFile(file);
                gfn_alert("파일은 " + mv_max_files + "개까지만 첨부할 수 있습니다.");
                return false;
              }
            });

            // 파라미터 전송 시
            mv_contentDropzone.on("sending", function (file, xhr, formData) {
              formData.append("file", file);
              formData.append("scriptGroupCode", mv_nowScriptGroupCode);

              // 로딩화면 보여짐
              $(".loading-overlay").show();
            });

            // 데이터 통신 성공 후
            mv_contentDropzone.on("success", function (file, responseText) {
              var resultData = new Object();

              try {
                resultData = JSON.parse(responseText);
              } catch (e) {}

              var resultCode = resultData.resultCode;
              var fileName = resultData.fileName;

              file.previewElement.classList.add("dz-success");
              file.previewElement.classList.remove("dz-error");
            });

            // 업로드 프로그레스 처리
            mv_contentDropzone.on("totaluploadprogress", function (progress) {
              $(".roller").width(progress + "%");
            });

            // 업로드 완료 시
            mv_contentDropzone.on("queuecomplete", function (progress) {
              gfn_alert("업로드 되었습니다.");

              // 로딩화면 숨김
              $(".loading-overlay").hide();

              $(".meter").delay(999).slideUp(999);

              var dropzone = $(".dropzone")[1].dropzone;
              dropzone.removeAllFiles();

              // 리로드
              mfn_productGrid.reload();
              mfn_contentList.load(mv_nowScriptData.PRD_CODE_A);

              mv_file_length = 0;
              mv_file_arr = [];
            });

            // 파일 삭제 시
            mv_contentDropzone.on("removedfile", function (file) {
              if (mv_file_arr.length > mv_max_files) {
                // 파일 갯수가 초과된 상태의 삭제
                mv_file_arr.splice(mv_max_files, Number.MAX_VALUE);
              } // 삭제 버튼으로 삭제시
              else {
                var fileName = file.name;
              }
            });

            // 파일 제한 갯수 초과시 이벤트
            mv_contentDropzone.on("mv_max_filesexceeded", function (file) {
              mv_contentDropzone.removeFile(file); // dropzone 기능상의 삭제, 폼을 삭제
              gfn_alert("파일은 " + mv_max_files + "개 까지만 첨부할 수 있습니다.");
            });
          },
        };

        $("#uploadScriptContentDropzone").dropzone(options);

        $("#btnContentUpload").on("click", function () {
          if (gfn_isEmpty(mv_file_arr)) {
            gfn_alert("업로드할 파일이 없습니다.");
          } else {
            mv_contentDropzone.processQueue();
          }
        });
      }
      break;
  }
  //	// 허용 확장자 처리
  //	var acceptFilesStr = "";
  //	if( mv_accept_files.length > 0 )
  //	{
  //		for( var i=0; i<mv_accept_files; i++ )
  //		{
  //			if( i > 0 ) acceptFilesStr += ',';
  //			acceptFilesStr += '.' + mv_accept_files[i] + '';
  //		}
  //		options.acceptedFiles = acceptFilesStr;
  //	}
}

function setPlayer(code, i) {
  var rootPath = gv_contextInfo.contextPath;
  var url = rootPath + "/api/tts/voice/" + mv_nowScriptType + "/" + code + ".wav";

  fetch(url)
    .then(function (response) {
      return response.arrayBuffer();
    })
    .then(function (arrayBuffer) {
      var blob = new Blob([arrayBuffer], { type: "audio/wav" });
      var blobUrl = URL.createObjectURL(blob);
      var ttsTarget = ".ttsIndex" + i;

      window.audio = new Audio();
      window.audio.src = blobUrl;
      window.audio.controls = true;
      window.audio.classList.add("ttsPlayer", "player" + i);

      document.querySelector(ttsTarget).appendChild(window.audio);
    })
    .catch(function (error) {
      console.error(error);
    });
}
