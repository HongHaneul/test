@RequestMapping(value="/selectGridData.do", method={RequestMethod.GET, RequestMethod.POST}, produces="application/json; charset=utf8")
	public @ResponseBody void selectGridData(HttpServletRequest request, HttpServletResponse response, Map<String, Object> map) {
		HashMap<String, Object> paramMap = (HashMap<String, Object>) commonService.paramSet(request); // Parameter Map
		HashMap<String, Object> resMap = new HashMap<String, Object>(); // Result Map
		PrintWriter jsonOut = null;
		int resultCode = 0;
				
		
		try
		{
			// 세션정보 가져오기
			UserVO userInfo = SessionManager.getUserInfo(request);
			if( userInfo != null )  // 세션에 계정정보가 있을 경우 실행
			{
				
				String mapperName = request.getParameter("mapperName");
				
				// ORDER BY 기준을 그리드 UI 이벤트를 통해 취득한다.
				try
				{
					// @param int iSortCol_0 - 기준 컬럼 순번
					// @param String sSortDir_0 - 정렬 기준 (ASC/DESC)
					
					// ORDER BY 컬럼순번
					String _sortColNum = String.valueOf(paramMap.get("iSortCol_0")); // Object to String
					int sortColNum = Integer.parseInt(_sortColNum); // String to Integer
					
					// 최초 실행 시 0을 보내주므로 생략한다. UI상에서는 0번쨰 컬럼에서 Ordering 이벤트를 방지한다.
					if( sortColNum > 0 )
					{
						// 컬럼 순번의 컬럼명 취득
						String sortTarget = "mDataProp_" + sortColNum;
						String sortColName = String.valueOf(paramMap.get(sortTarget)); // Object to String
						String sortColTarget = String.valueOf(paramMap.get("sSortDir_0")); // Object to String
						
						String sSortCol = sortColName + " " + sortColTarget;
						paramMap.put("sSortCol", sSortCol);
					}
				}
				catch(Exception e) { }
				
				List<Map<String,Object>> selectGridData = commonService.commSelectList("script.selectScriptList", paramMap);
				System.out.println(paramMap);
				System.out.println(selectGridData);

				if( request.getParameter("iDisplayStart") != null ) // 그리드 쿼리 페이징 처리할 경우
				{					
					// 테이블의 전체 로우 수
					List<Map<String,Object>> selectPagingCount = commonService.commSelectList(mapperName+"Count", paramMap);
					String resCount = String.valueOf(selectPagingCount.get(0).get("COUNT")); // Object to String
					int totalCount = Integer.parseInt(resCount); // String to Integer

					resMap.put("aaData", selectGridData);
					resMap.put("iTotalRecords", totalCount);
					resMap.put("iTotalDisplayRecords", totalCount);
					resMap.put("sEcho", map.get("sEcho"));
				}
				else // 일반 출력할 경우
				{
					resMap.put("rows", selectGridData);
				}
				
				jsonOut = response.getWriter();
				jsonOut.write( JsonUtil.getJsonObjectStringFromMap(resMap) );
				jsonOut.flush();
				jsonOut.close();
			}
			else
			{
				resultCode = 10;
			}
			
			resMap.put("resultCode", resultCode);
		}
		catch(Exception e)
		{
			e.printStackTrace();
			return;
		}
	}