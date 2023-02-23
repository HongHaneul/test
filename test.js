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
