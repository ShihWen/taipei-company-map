//code alignment: Ctrl + Alt + I
//const mapboxToken = config.mapboxToken;
mapboxgl.accessToken = 'pk.eyJ1Ijoic2hpaHdlbnd1dHdiZXRhIiwiYSI6ImNrZDdjMnVkbDIxN24ycmw1cnJuZmhubXgifQ.gebZuDMv9q_pYcd9gPfIrQ';

//Functions
let featureSetting = (sourceName, sourceLayer, stateID, stateObject) => {
    map.setFeatureState({
        source: sourceName,
        sourceLayer: sourceLayer,
        id: stateID
    }, stateObject);
}

let featureSettingBulk = (inputSourceNameArray, inputSourceLayerArray, stateId, stateObject) => {
    for (i=0;i<inputSourceNameArray.length;i++){
        featureSetting(inputSourceNameArray[i], inputSourceLayerArray[i], stateId, stateObject);
    }
}

let addSourceAndLayer = (inputSourceName, inputSourceUrl, inputGivenLayerId, inputSourceLayer, inputZoomThreshold, inputCircleColor) => {
    map.addSource(inputSourceName, {
        "type": "vector",
        "url": inputSourceUrl
    });
    map.addLayer({
        'id': inputGivenLayerId,
        'type': 'circle',
        'source': inputSourceName,
        'layout':{
            'visibility': 'visible'
        },
        'source-layer': inputSourceLayer,
        'minzoom': inputZoomThreshold,
        'paint': {
            'circle-radius': [
                'case',
                ['boolean', ['feature-state', 'hover'], false],
                10,
                ['boolean', ['feature-state', 'clickMain'], false],
                6,
                ['boolean', ['feature-state', 'click'], false],
                3.5,
                1.75
            ],
            'circle-color': [
                'case',
                ['boolean', ['feature-state', 'hover'], false],
                'red',
                ['boolean', ['feature-state', 'clickMain'], false],
                'red',
                ['boolean', ['feature-state', 'click'], false],
                '#f7fcb9',
                inputCircleColor
            ],
            'circle-stroke-width': [
                'case',
                ['boolean', ['feature-state', 'hover'], false],
                1,
                ['boolean', ['feature-state', 'clickMain'], false],
                1,
                ['boolean', ['feature-state', 'click'], false],
                0.7,
                0.3
            ],
            'circle-stroke-color':[
                'case',
                ['boolean', ['feature-state', 'hover'], false],
                'black',
                ['boolean', ['feature-state', 'click'], false],
                'black',
                ['boolean', ['feature-state', 'clickMain'], false],
                'black',
                'rgba(0,0,0,0.25)'
            ],
        }
    });    
}

let addSourceAndLayerBulk = (inputSourceNameArray, inputSourceUrlArray, inputGivenLayerId, inputSourceLayerArray, inputZoomThreshold, inputCircleColor) => {
    for (i=0;i<inputSourceNameArray.length;i++){
        addSourceAndLayer(inputSourceNameArray[i], inputSourceUrlArray[i], inputGivenLayerId[i], inputSourceLayerArray[i], inputZoomThreshold, inputCircleColor);
    }
}

let filterBy = (yearMin, yearMax) => {
    let filters = [
        "all",     
        [">=", ['get', 'set_yr'], yearMin],
        ["<=", ['get', 'set_yr'], yearMax]
    ]


    if (filtersCat) {
        let combinedFilter = ["all", filters, filtersCat];
        filters = combinedFilter;
    }

    map.setFilter('station-origin-LargeZoom', filters);
    map.setFilter('station-origin-LargeZoom2', filters);
    map.setFilter('station-origin-LargeZoom3', filters);
    map.setFilter('station-origin-LargeZoom4', filters);
    map.setFilter('station-origin-LargeZoom5', filters);
    map.setFilter('station-origin-LargeZoom6', filters);
    map.setFilter('station-origin-LargeZoom7', filters);
    map.setFilter('station-origin-LargeZoom8', filters);
    map.setFilter('station-origin-LargeZoom9', filters);
    //map.setFilter('station-origin-smallZoom', filters);
    //map.setFilter('station-access', filters);
    //map.setFilter('station-access2', filters);


}

let selectedCatArray = []
let getSelectedCat = (selectedCat) => {
    //selectedCatArray.push(selectedCat);
    //console.log(selectedCatArray);
    $(".tm-input").val(selectedCat);
    let e = $.Event("keypress", { keyCode: 13});  //I think it is 13
    $(".tm-input").trigger(e)
}


let center = [121.51750, 25.04769];
let radius = 0.2
let options = {steps: 40, units: 'kilometers', properties: {foo: 'bar'}};
let circle


let statisics
let chartData
let pieChartTopN = 3
let bufferAnalysisZoom = 13.4

let circleFillColorOpen = '#b2df8a';
let circleFillColorClose = '#a9a9a9';

let circleUpdate = (coordsInput, radiusInput, optionsInput) => {
    center = coordsInput
    circle = turf.circle(center, radiusInput, optionsInput);
    //console.log(center, radius, options, circle);
    map.getSource('company-buffer').setData({
        type: 'FeatureCollection',
        features: [
            circle
        ]
    });

    let mapLayer = map.getLayer('buffer');
    if(typeof(mapLayer !== 'undefined')) {
        // Remove map layer & source.
        map.removeLayer('buffer')//.removeSource('route');
    }
    if( map.getZoom() > bufferAnalysisZoom ){
        map.addLayer({
            id: 'buffer',
            type: 'fill',
            source: 'company-buffer',
            paint:{
                'fill-color':circleFillColorOpen,
                'fill-opacity': 0.75
            }
        }, 'station-origin-LargeZoom6');
    } else {
        map.addLayer({
            id: 'buffer',
            type: 'fill',
            source: 'company-buffer',
            paint:{
                'fill-color':circleFillColorClose,
                'fill-opacity': 0.75
            }
        }, 'station-origin-LargeZoom6');
    }


}

let onMove = (e) => {
    let coords = e.lngLat;
    coords_array = [coords.lng, coords.lat]
    // Set a UI indicator for dragging.
    canvas.style.cursor = 'grabbing';

    // Update the Point feature in `geojson` coordinates
    // and call setData to the source layer `point` on it.
    circleUpdate(coords_array, radius, options);
}


let onUp = (e) => {
    let coords = e.lngLat;
    //console.log(stopQueryFtr);
    // Unbind mouse/touch events
    map.off('mousemove', onMove);
    map.off('touchmove', onMove);

    bufferAnalysis(turfFeatures, circle);
    //stopQueryFtr = 0;
    //console.log(stopQueryFtr);

}

let featureForTurf = (inputFeatureArray) => {
    turfFeatures = {type:"FeatureCollection", features:[]};
    inputFeatureArray.forEach(function(ftr){
        turfFeatures['features'].push(turf.point([ftr.geometry.coordinates[0], ftr.geometry.coordinates[1]],
                                                 {id:ftr.id,
                                                  category:ftr.properties.大類集,
                                                  name:ftr.properties.營業人名稱,
                                                  industry:ftr.properties.業種}
                                                )
                                     )
    });

    return turfFeatures;
}

// Not used
let turfArrayFix = (inputArray) => {
    outputArray =  {type:"FeatureCollection", features:[]};
    idInArray = [];
    inputArray['features'].forEach(function(ftr){
        if( !idInArray.includes(ftr.properties.id) ) {
            outputArray['features'].push(ftr)
            idInArray.push(ftr.properties.id);
        }

    });
    return outputArray
}

let cateCalculator = (turfArrayFix) => {
    cateStat = {};
    turfArrayFix['features'].forEach(function(ftr){
        if (typeof(ftr.properties.category)!=="undefined"){
            cateArray = ftr.properties.category.split(' ');
            //console.log(cateArray);
        } else {
            cateArray = ["X"];
        }

        emptyIdx = cateArray.indexOf("");
        //cateArray.splice(emptyIdx, 1);
        cateArray.forEach(function(element){
            if (element in cateStat){
                cateStat[element] ++ 
            } else {
                cateStat[element] = 1
            }
        });



    });
    return cateStat;
}

let sortDict = (cateCalculator, topN) => {
    let sortable = [];
    for (var category in cateCalculator) {
        sortable.push([category, cateCalculator[category]]);
    }

    sortable.sort(function(a, b) {
        return b[1] - a[1];
    });

    rankArray = [];
    others = 0;
    for(i=0; i<sortable.length; i++){
        if(i < topN){
            rankArray.push(sortable[i])
        } else {
            others = others + sortable[i][1]
        }
    }
    other_array = ['others', others];
    rankArray.push(other_array);



    let = sortedDict = {};
    rankArray.forEach(function(item){
        sortedDict[item[0]]=item[1]
    })
    //console.log(sortedDict);
    return sortedDict


}

const categoryMeta = {
    A:"農、林、漁、牧",
    B:"礦業及土石採取",
    C:"製造業",
    D:"電力及燃氣供應",
    E:"用水供應及汙染整治",
    F:"營建工程",
    G:"批發及零售",
    H:"運輸及倉儲",
    I:"住宿及餐飲",
    J:"出版、影音製作、傳播及資通訊服務",
    K:"金融及保險",
    L:"不動產",
    M:"專業、科學及技術服務",
    N:"支援服務",
    O:"公共行政及國防；強制性社會安全",
    P:"教育",
    Q:"醫療保健及社會工作服務",
    R:"藝術、娛樂及休閒服務",
    S:"其他服務業",
    others:"其他產業"
}

let colorGenerator = (opacity) => {
    let categoryColor = {
        A:`rgba(60, 180, 75, ${opacity})`, //農、林、漁、牧 Green
        B:`rgba(0, 128, 128, ${opacity})`,  //礦業及土石採取 Teal
        C:`rgba(0, 130, 120, ${opacity})`, //"製造業", Blue
        D:`rgba(255, 250, 200, ${opacity})`, //"電力及燃氣供應", Beige
        E:`rgba(70, 240, 240, ${opacity})`, //"用水供應及汙染整治", Cyan
        F:`rgba(170, 110, 40, ${opacity})`, //"營建工程", Brown
        G:`rgba(230, 25, 75, ${opacity})`, //"批發及零售", Red
        H:`rgba(0, 0, 128, ${opacity})`, //"運輸及倉儲", Navy
        I:`rgba(245, 130, 48, ${opacity})`, //"住宿及餐飲", Orange
        J:`rgba(145, 30, 180, ${opacity})`, //"出版、影音製作、傳播及資通訊服務", purple
        K:`rgba(255, 215, 180, ${opacity})`, //"金融及保險", Apricot
        L:`rgba(250, 190, 212, ${opacity})`, //"不動產",Pink
        M:`rgba(170, 255, 195, ${opacity})`, //"專業、科學及技術服務", Mint
        N:`rgba(210, 245, 60, ${opacity})`, //"支援服務", Lime
        O:`rgba(128, 128, 0, ${opacity})`, //"公共行政及國防；強制性社會安全",Olive
        P:`rgba(220, 190, 255, ${opacity})`, //"教育",Lavender
        Q:`rgba(128, 0, 0, ${opacity})`, //"醫療保健及社會工作服務",Maroon
        R:`rgba(240, 50, 230, ${opacity})`, //"藝術、娛樂及休閒服務", Magenta
        S:`rgba(128, 128, 128, ${opacity})`, //"其他服務", Grey
        others:`rgba(200, 200, 200, ${opacity})` //"其他產業", DarkGrey    
    }
    return categoryColor;
}

let sourceForChart = (sortDict) => {
    dataObj = {labels:[], data:[], backgroundColor:[], strokeColor:[]};
    backgroundColor = colorGenerator(0.5);
    strokeColor = colorGenerator(1);
    for (const [key, value] of Object.entries(sortDict)){
        for (const [catID, catDESC] of Object.entries(categoryMeta)){
            if (catID === key){
                dataObj["labels"].push(catDESC);
                dataObj["data"].push(value);
            }
        }

        for (const [catID, color] of Object.entries(backgroundColor)){
            if (catID === key){
                dataObj["backgroundColor"].push(color);
                dataObj["strokeColor"].push(color);
            }
        }


    }
    //console.log(dataObj);
    return dataObj
}

let bufferAnalysis = (turfFeatures, circle) => {
    compWithin = turf.pointsWithinPolygon(turfFeatures, circle);
    statisics = cateCalculator(compWithin);
    sortedData = sortDict(statisics, pieChartTopN);

    chartData = sourceForChart(sortedData);
    myChart.destroy();

    if (map.getZoom() >= zoomThreshold) {
        chartGenerator(chartData["labels"], 
                       chartData["data"],
                       chartData["backgroundColor"],
                       chartData["strokeColor"]);
    } else {
        chartGenerator(["請拉近地圖"], 
                       [1,]);
    }

}

// listener for sourcedata event.
let onSourceData = (e) => {

    if (e.isSourceLoaded) {
        // the update is complete: unsubscribe this listener and
        // move on with whatever we need to do next (in this case,
        // schedule the next step in the animation)
        map.off('sourcedata', onSourceData);
        bufferAnalysis(turfFeatures, circle);
    }


}


//FlyLoc Generator
let flyLoc = {geometry:[]};
let flyLocGenerator = (codeVal) => {
    flyLoc = {geometry:[]};
    featuresFromMoveend.forEach(function(ftr){
        let ftrNum = String(ftr.properties.統一編);
        let newFtrNum = ''

        if (ftrNum.length < 8) {
            let addZ = 8 - ftrNum.length
            newFtrNum = "0".repeat(addZ) + ftrNum;
        } else {
            newFtrNum = ftrNum;
        }

        if (codeVal === newFtrNum){
            flyLoc['geometry'].push(ftr.geometry.coordinates[0]);
            flyLoc['geometry'].push(ftr.geometry.coordinates[1]);
            flyLoc['ftrId'] = ftr.id;
            flyLoc['layerId'] = ftr.layer.id;
            flyLoc['source'] = ftr.layer.source;
            flyLoc['sourceLayer'] = ftr.layer['source-layer'];
            flyLoc['compName'] = ftr.properties.營業人
            flyLoc['startDate'] = ftr.properties.設立日
            flyLoc['industryDesc'] = ftr.properties.業種集

            //console.log(`${codeVal}:${flyLoc}`);
        }
    });
}


//Layer
const source_name1 = 'stations1'
const source_layer1 = 'TPE_v4_pt1';
const source_url1 = "mapbox://" + "shihwenwutwbeta.66rgxbem"
const givenLayerId1 = 'station-origin-LargeZoom'

const source_name2 = 'stations2'
const source_layer2 = 'TPE_v4_pt2';
const source_url2 = "mapbox://" + "shihwenwutwbeta.5b5vq29p"
const givenLayerId2 = 'station-origin-LargeZoom2'


const source_name3 = 'stations3'
const source_layer3 = 'TPE_v4_pt3';
const source_url3 = "mapbox://" + "shihwenwutwbeta.14v6ramt"
const givenLayerId3 = 'station-origin-LargeZoom3'

const source_name4 = 'stations4'
const source_layer4 = 'TPE_v4_pt4';
const source_url4 = "mapbox://" + "shihwenwutwbeta.d40ssz9g"
const givenLayerId4 = 'station-origin-LargeZoom4'

const source_name5 = 'stations5'
const source_layer5 = 'TPE_v4_pt5';
const source_url5 = "mapbox://" + "shihwenwutwbeta.3m5zox93"
const givenLayerId5 = 'station-origin-LargeZoom5'

const source_name6 = 'stations6'
const source_layer6 = 'TPE_v4_pt6';
const source_url6 = "mapbox://" + "shihwenwutwbeta.br3jbv34"
const givenLayerId6 = 'station-origin-LargeZoom6'

const source_name7 = 'stations7'
const source_layer7 = 'TPE_v4_pt7';
const source_url7 = "mapbox://" + "shihwenwutwbeta.ddz0ea48"
const givenLayerId7 = 'station-origin-LargeZoom7'

const source_name8 = 'stations8'
const source_layer8 = 'TPE_v4_pt8';
const source_url8 = "mapbox://" + "shihwenwutwbeta.8zjvn069"
const givenLayerId8 = 'station-origin-LargeZoom8'

const source_name9 = 'stations9'
const source_layer9 = 'TPE_v4_pt9';
const source_url9 = "mapbox://" + "shihwenwutwbeta.7iaev5fh"
const givenLayerId9 = 'station-origin-LargeZoom9'

const sourceNameArray = [source_name1, source_name2, source_name3, 
                         source_name4, source_name5, source_name6,
                         source_name7, source_name8, source_name9];

const sourceLayerArray = [source_layer1, source_layer2, source_layer3,
                          source_layer4, source_layer5, source_layer6,
                          source_layer7, source_layer8, source_layer9];

const sourceUrlArray = [source_url1, source_url2, source_url3,
                        source_url4, source_url5, source_url6,
                        source_url7, source_url8, source_url9];

const givenLayerIdArray = [givenLayerId1, givenLayerId2, givenLayerId3, 
                           givenLayerId4, givenLayerId5, givenLayerId6,
                           givenLayerId7, givenLayerId8, givenLayerId9];


let map =  new mapboxgl.Map({
    container: 'map', // container id
    style: 'mapbox://styles/shihwenwutwbeta/ckf9fs1zt2a7w19mk56otgzcx', // stylesheet location
    center: [121.51750, 25.04769], // starting position [lng, lat]
    zoom: 14.6,
    minZoom: 13.5, //10.75
    maxZoom: 16, // starting zoom
    customAttribution: 'ee'
});  

map.addControl(new mapboxgl.NavigationControl(), 'bottom-right');

//features by moveend
let featuresFromMoveend = [];
let circlePolygon = [];
let turfFeatures = {type:"FeatureCollection", features:[]};
let compWithin

const canvas = map.getCanvasContainer();
const zoomThreshold = 14.4;
const circleColor = 'rgba(0,0,200,1)'

map.on('load',function(){
    //company layers
    //Add Layer
    addSourceAndLayerBulk(sourceNameArray, sourceUrlArray, givenLayerIdArray, sourceLayerArray, zoomThreshold, circleColor);

    //buffer layer
    map.addSource('company-buffer', {
        type: 'geojson',
        data: {
            type: 'FeatureCollection',
            features: [
            ]
        }
    });

    map.on('moveend', function() {
        //featureArrayUpdate(featuresFromMoveend);

        featuresFromMoveend = [];
        featuresFromMoveend = map.queryRenderedFeatures({layers: givenLayerIdArray});

        circleUpdate(center, radius, options);
        circlePolygon = [];
        circlePolygon = map.queryRenderedFeatures({layers: ['buffer']});

        if (map.getZoom() < bufferAnalysisZoom){
            $("#buffer-slider-input").attr('disabled', true);
        } else {
            $("#buffer-slider-input").attr('disabled', false);
        }

        turfFeatures = featureForTurf(featuresFromMoveend);
        console.log(map.getZoom());



    })

    let hoveredStateId = null;
    map.on('mousemove', givenLayerId1, function(e){
        if (e.features.length > 0 & !enterCircle) {
            map.getCanvas().style.cursor = 'pointer';
            if (hoveredStateId) {
                // set the hover attribute to false with feature state
                featureSettingBulk(sourceNameArray, sourceLayerArray, hoveredStateId,{hover:false})
            }
            hoveredStateId = e.features[0].id;
            featureSetting(source_name1, source_layer1, hoveredStateId, {hover:true});
        }
    });

    map.on('mousemove', givenLayerId2, function(e){
        if (e.features.length > 0 & !enterCircle) {
            map.getCanvas().style.cursor = 'pointer';
            if (hoveredStateId) {
                // set the hover attribute to false with feature state
                featureSettingBulk(sourceNameArray, sourceLayerArray, hoveredStateId,{hover:false})
            }
            hoveredStateId = e.features[0].id;
            featureSetting(source_name2, source_layer2, hoveredStateId, {hover:true});
        }
    });

    map.on('mousemove', givenLayerId3, function(e){
        if (e.features.length > 0 & !enterCircle) {
            map.getCanvas().style.cursor = 'pointer';
            if (hoveredStateId) {
                // set the hover attribute to false with feature state
                featureSettingBulk(sourceNameArray, sourceLayerArray, hoveredStateId,{hover:false})
            }
            hoveredStateId = e.features[0].id;
            featureSetting(source_name3, source_layer3, hoveredStateId, {hover:true});
        }
    });

    map.on('mousemove', givenLayerId4, function(e){
        if (e.features.length > 0 & !enterCircle) {
            map.getCanvas().style.cursor = 'pointer';
            if (hoveredStateId) {
                // set the hover attribute to false with feature state
                featureSettingBulk(sourceNameArray, sourceLayerArray, hoveredStateId,{hover:false})
            }
            hoveredStateId = e.features[0].id;
            featureSetting(source_name4, source_layer4, hoveredStateId, {hover:true});
        }
    });

    map.on('mousemove', givenLayerId5, function(e){
        if (e.features.length > 0 & !enterCircle) {
            map.getCanvas().style.cursor = 'pointer';
            if (hoveredStateId) {
                // set the hover attribute to false with feature state
                featureSettingBulk(sourceNameArray, sourceLayerArray, hoveredStateId,{hover:false});
            }
            hoveredStateId = e.features[0].id;
            featureSetting(source_name5, source_layer5, hoveredStateId, {hover:true});
        }
    });

    map.on('mousemove', givenLayerId6, function(e){
        if (e.features.length > 0 & !enterCircle) {
            map.getCanvas().style.cursor = 'pointer';
            if (hoveredStateId) {
                // set the hover attribute to false with feature state
                featureSettingBulk(sourceNameArray, sourceLayerArray, hoveredStateId,{hover:false});
            }
            hoveredStateId = e.features[0].id;
            featureSetting(source_name6, source_layer6, hoveredStateId, {hover:true});
        }
    });

    map.on('mousemove', givenLayerId7, function(e){
        if (e.features.length > 0 & !enterCircle) {
            map.getCanvas().style.cursor = 'pointer';
            if (hoveredStateId) {
                // set the hover attribute to false with feature state
                featureSettingBulk(sourceNameArray, sourceLayerArray, hoveredStateId,{hover:false});
            }
            hoveredStateId = e.features[0].id;
            featureSetting(source_name7, source_layer7, hoveredStateId, {hover:true});
        }
    });

    map.on('mousemove', givenLayerId8, function(e){
        if (e.features.length > 0 & !enterCircle) {
            map.getCanvas().style.cursor = 'pointer';
            if (hoveredStateId) {
                // set the hover attribute to false with feature state
                featureSettingBulk(sourceNameArray, sourceLayerArray, hoveredStateId,{hover:false});
            }
            hoveredStateId = e.features[0].id;
            featureSetting(source_name8, source_layer8, hoveredStateId, {hover:true});
        }
    });

    map.on('mousemove', givenLayerId9, function(e){
        if (e.features.length > 0 & !enterCircle) {
            map.getCanvas().style.cursor = 'pointer';
            if (hoveredStateId) {
                // set the hover attribute to false with feature state
                featureSettingBulk(sourceNameArray, sourceLayerArray, hoveredStateId,{hover:false});
            }
            hoveredStateId = e.features[0].id;
            featureSetting(source_name9, source_layer9, hoveredStateId, {hover:true});
        }
    });


    map.on("mouseleave", givenLayerId1, function() {
        map.getCanvas().style.cursor = '';
        if (hoveredStateId) {
            featureSettingBulk(sourceNameArray, sourceLayerArray, hoveredStateId,{hover:false});
        }
    });

    map.on("mouseleave", givenLayerId2, function() {
        map.getCanvas().style.cursor = '';
        if (hoveredStateId) {
            featureSettingBulk(sourceNameArray, sourceLayerArray, hoveredStateId,{hover:false});
        }
    });

    map.on("mouseleave", givenLayerId3, function() {
        map.getCanvas().style.cursor = '';
        if (hoveredStateId) {
            featureSettingBulk(sourceNameArray, sourceLayerArray, hoveredStateId,{hover:false});
        }
    });

    map.on("mouseleave", givenLayerId4, function() {
        map.getCanvas().style.cursor = '';
        if (hoveredStateId) {
            featureSettingBulk(sourceNameArray, sourceLayerArray, hoveredStateId,{hover:false});
        }
    });

    map.on("mouseleave", givenLayerId5, function() {
        map.getCanvas().style.cursor = '';
        if (hoveredStateId) {
            featureSettingBulk(sourceNameArray, sourceLayerArray, hoveredStateId,{hover:false});
        }
    });

    map.on("mouseleave", givenLayerId6, function() {
        map.getCanvas().style.cursor = '';
        if (hoveredStateId) {
            featureSettingBulk(sourceNameArray, sourceLayerArray, hoveredStateId,{hover:false});
        }
    });

    map.on("mouseleave", givenLayerId7, function() {
        map.getCanvas().style.cursor = '';
        if (hoveredStateId) {
            featureSettingBulk(sourceNameArray, sourceLayerArray, hoveredStateId,{hover:false});
        }
    });

    map.on("mouseleave", givenLayerId8, function() {
        map.getCanvas().style.cursor = '';
        if (hoveredStateId) {
            featureSettingBulk(sourceNameArray, sourceLayerArray, hoveredStateId,{hover:false});
        }
    });

    map.on("mouseleave", givenLayerId9, function() {
        map.getCanvas().style.cursor = '';
        if (hoveredStateId) {
            featureSettingBulk(sourceNameArray, sourceLayerArray, hoveredStateId,{hover:false});
        }
    });

    let clickId
    map.on("click", givenLayerId1, function(e){
        if(e.features.length > 0 & !enterCircle){
            $('#company-name').html(e.features[0].properties.營業人);
            $('#established-date').html(e.features[0].properties.設立日);
            $('#industry-name').html(e.features[0].properties.業種集);

            if (clickId){
                featureSettingBulk(sourceNameArray, sourceLayerArray, clickId, {clickMain:false});
            }

            clickId = e.features[0].id;
            featureSetting(source_name1, source_layer1, clickId, {clickMain:true});
            console.log(e.features[0].properties.統一編);

        }
    });

    map.on("click", givenLayerId2, function(e){
        if(e.features.length > 0 & !enterCircle){
            $('#company-name').html(e.features[0].properties.營業人);
            $('#established-date').html(e.features[0].properties.設立日);
            $('#industry-name').html(e.features[0].properties.業種集);

            if (clickId){
                featureSettingBulk(sourceNameArray, sourceLayerArray, clickId, {clickMain:false});
            }

            clickId = e.features[0].id;
            featureSetting(source_name2, source_layer2, clickId, {clickMain:true});
            console.log(e.features[0].properties.統一編);

        }
    });

    map.on("click", givenLayerId3, function(e){
        if(e.features.length > 0 & !enterCircle){
            $('#company-name').html(e.features[0].properties.營業人);
            $('#established-date').html(e.features[0].properties.設立日);
            $('#industry-name').html(e.features[0].properties.業種集);

            if (clickId){
                featureSettingBulk(sourceNameArray, sourceLayerArray, clickId, {clickMain:false});
            }

            clickId = e.features[0].id;
            featureSetting(source_name3, source_layer3, clickId, {clickMain:true});
            console.log(e.features[0].properties.統一編);
        }
    });

    map.on("click", givenLayerId4, function(e){
        if(e.features.length > 0 & !enterCircle){
            $('#company-name').html(e.features[0].properties.營業人);
            $('#established-date').html(e.features[0].properties.設立日);
            $('#industry-name').html(e.features[0].properties.業種集);

            if (clickId){
                featureSettingBulk(sourceNameArray, sourceLayerArray, clickId, {clickMain:false});
            }

            clickId = e.features[0].id;
            featureSetting(source_name4, source_layer4, clickId, {clickMain:true});
            console.log(e.features[0].properties.統一編);

        }
    });

    map.on("click", givenLayerId5, function(e){
        if(e.features.length > 0 & !enterCircle){
            $('#company-name').html(e.features[0].properties.營業人);
            $('#established-date').html(e.features[0].properties.設立日);
            $('#industry-name').html(e.features[0].properties.業種集);

            if (clickId){
                featureSettingBulk(sourceNameArray, sourceLayerArray, clickId, {clickMain:false}); 
            }

            clickId = e.features[0].id;
            featureSetting(source_name5, source_layer5, clickId, {clickMain:true});
            console.log(e.features[0].properties.統一編);

        }
    });

    map.on("click", givenLayerId6, function(e){
        if(e.features.length > 0 & !enterCircle){
            $('#company-name').html(e.features[0].properties.營業人);
            $('#established-date').html(e.features[0].properties.設立日);
            $('#industry-name').html(e.features[0].properties.業種集);

            if (clickId){
                featureSettingBulk(sourceNameArray, sourceLayerArray, clickId, {clickMain:false});
            }

            clickId = e.features[0].id;
            featureSetting(source_name6, source_layer6, clickId, {clickMain:true});
            console.log(e.features[0].properties.統一編);

        }
    });

    map.on("click", givenLayerId7, function(e){
        if(e.features.length > 0 & !enterCircle){
            $('#company-name').html(e.features[0].properties.營業人);
            $('#established-date').html(e.features[0].properties.設立日);
            $('#industry-name').html(e.features[0].properties.業種集);

            if (clickId){
                featureSettingBulk(sourceNameArray, sourceLayerArray, clickId, {clickMain:false});
            }

            clickId = e.features[0].id;
            featureSetting(source_name7, source_layer7, clickId, {clickMain:true});
            console.log(e.features[0].properties.統一編);

        }
    });

    map.on("click", givenLayerId8, function(e){
        if(e.features.length > 0 & !enterCircle){
            $('#company-name').html(e.features[0].properties.營業人);
            $('#established-date').html(e.features[0].properties.設立日);
            $('#industry-name').html(e.features[0].properties.業種集);

            if (clickId){
                featureSettingBulk(sourceNameArray, sourceLayerArray, clickId, {clickMain:false});
            }

            clickId = e.features[0].id;
            featureSetting(source_name8, source_layer8, clickId, {clickMain:true});
            console.log(e.features[0].properties.統一編);

        }
    });

    map.on("click", givenLayerId9, function(e){
        if(e.features.length > 0 & !enterCircle){
            $('#company-name').html(e.features[0].properties.營業人);
            $('#established-date').html(e.features[0].properties.設立日);
            $('#industry-name').html(e.features[0].properties.業種集);

            if (clickId){
                featureSettingBulk(sourceNameArray, sourceLayerArray, clickId, {clickMain:false});
            }

            clickId = e.features[0].id;
            featureSetting(source_name9, source_layer9, clickId, {clickMain:true});
            console.log(e.features[0].properties.統一編);

        }
    });


    $(".noUi-handle-lower").on('mouseup',function(e){
        let yearMin = parseInt(minSliderVal, 10);
        let yearMax = parseInt(maxSliderVal, 10);
        filterBy(yearMin, yearMax);
        map.on('sourcedata', onSourceData);
    });

    $(".noUi-handle-upper").on('mouseup',function(e){
        let yearMin = parseInt(minSliderVal, 10);
        let yearMax = parseInt(maxSliderVal, 10);
        filterBy(yearMin, yearMax);
        map.on('sourcedata', onSourceData);
    });

    $("#buffer-slider-input").on('mouseup',function(e){
        let range = $("#buffer-slider-input").val()/100*1000;
        $("#buffer-range-value").text(range);

        radius = range/1000;
        circleUpdate(center, radius, options);
        bufferAnalysis(turfFeatures, circle);

    });


    $(".noUi-handle-lower").on('touchend',function(e){
        let yearMin = parseInt(minSliderVal, 10);
        let yearMax = parseInt(maxSliderVal, 10);
        filterBy(yearMin, yearMax);
        map.on('sourcedata', onSourceData);
    });

    $(".noUi-handle-upper").on('touchend',function(e){
        let yearMin = parseInt(minSliderVal, 10);
        let yearMax = parseInt(maxSliderVal, 10);
        filterBy(yearMin, yearMax);
        map.on('sourcedata', onSourceData);
    });

    $("#buffer-slider-input").on('touchend',function(e){
        let range = $("#buffer-slider-input").val()/100*1000;
        $("#buffer-range-value").text(range);

        radius = range/1000;
        circleUpdate(center, radius, options);
        bufferAnalysis(turfFeatures, circle);

    });

    let codeVal
    $("#catCode").on('keyup', function(e){
        codeVal = $("#catCode").val();
        //console.log(typeof(codeVal));
        if (codeVal.length === 8) {
            flyLocGenerator(codeVal);
        }  
    });

    $("#flyTo").on('click', function(){

        flyLocGenerator(codeVal);
        if (flyLoc['geometry'].length != 0){
            map.flyTo({
                center: [
                    flyLoc['geometry'][0],
                    flyLoc['geometry'][1]
                ],
                essential: true // this animation is considered essential with respect to prefers-reduced-motion
            });


            if (clickId){
                featureSettingBulk(sourceNameArray, sourceLayerArray, clickId, {clickMain:false});
            }

            clickId = flyLoc['ftrId']
            featureSetting(flyLoc['source'],flyLoc['sourceLayer'], clickId, {clickMain:true});

            $('#company-name').html(flyLoc['compName']);
            $('#established-date').html(flyLoc['startDate']);
            $('#industry-name').html(flyLoc['industryDesc']);
            $('#search-result').html('搜尋成功！');

        } else {
            $('#search-result').html('不在範圍內..');
        } 
    });


    let enterCircle = 0;
    let stopQueryFtr = 0;
    map.on('mouseenter', 'buffer', function () {
        //console.log('mouseEnter');
        enterCircle = 1;
        //stopQueryFtr = 1;
        if (map.getZoom() > bufferAnalysisZoom){
            map.setPaintProperty('buffer', 'fill-color', '#3bb2d0');
            canvas.style.cursor = '';
            if (hoveredStateId) {
                featureSettingBulk(sourceNameArray, sourceLayerArray, hoveredStateId, {hover:false});
            }
        }

    });

    map.on('mouseleave', 'buffer', function () {
        //console.log('mouseLeave');
        enterCircle = 0;
        //stopQueryFtr = 0
        if (map.getZoom() > bufferAnalysisZoom){
            map.setPaintProperty('buffer', 'fill-color', circleFillColorOpen);
            canvas.style.cursor = '';
        }

    });

    map.on('mousedown', 'buffer', function (e) {
        // Prevent the default map drag behavior.
        console.log('moouseDown');
        stopQueryFtr = 1
        if (map.getZoom() > bufferAnalysisZoom){
            compWithin = [];
            e.preventDefault();
            canvas.style.cursor = 'grab';
            map.on('mousemove', onMove);
            map.once('mouseup', onUp);
        }

    });

    map.on('mouseup', 'buffer', function (e) {
        // Prevent the default map drag behavior.
        console.log('moouseUp');
        stopQueryFtr = 0

    });

    map.on('touchstart', 'buffer', function (e) {
        // Prevent the default map drag behavior.
        stopQueryFtr = 1
        //console.log(stopQueryFtr);
        if (map.getZoom() > bufferAnalysisZoom){
            compWithin = [];
            e.preventDefault();
            canvas.style.cursor = 'grab';
            map.on('touchmove', onMove);
            map.once('touchend', onUp);
        }

    });

    map.on('touchend', 'buffer', function (e) {
        // Prevent the default map drag behavior.
        stopQueryFtr = 0
        //console.log(stopQueryFtr);
    });


    /*Get features for first opening*/
    circleUpdate(center, radius, options);


    /*Deafault Year Filter*/
    filterBy(1980, 2020);

    /*Deafault Circle Area*/
    $("#buffer-range-value").text(radius*1000);

    map.on('sourcedata', function(e) {
        if (e.isSourceLoaded) {
            //console.log(stopQueryFtr);
            if (stopQueryFtr === 0){

                // Do something when the source has finished loading
                circlePolygon = [];

                circlePolygon = map.queryRenderedFeatures({layers: ['buffer']});


                featuresFromMoveend = [];
                featuresFromMoveend = map.queryRenderedFeatures({layers: givenLayerIdArray});

                circlePolygon = map.queryRenderedFeatures({layers: ['buffer']});
                turfFeatures = featureForTurf(featuresFromMoveend);
                console.log('source update.')
            }
        }
    });

});

/*=================== Graphs =====================*/

let labels = ['產業A', '產業B', '產業C', '產業D']
let data = [1, 1, 3, 5]
let ctx = document.getElementById('myChart').getContext('2d');
let myChart
let chartGenerator = (labelsInput, dataInput, backgroundColorArray, strokeColorArray) => {
    let = labelArray = []
    for (i=0; i<labelsInput.length; i++){
        labelArray.push('black');
    }

    myChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labelsInput,
            datasets: [{
                label: '# of Votes',
                data: dataInput,
                backgroundColor: backgroundColorArray,
                borderColor: strokeColorArray,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                labels: {
                    render: 'percentage',
                    fontColor: labelArray,
                    precision: 1
                    //position: 'outside'
                }
            },
        }

    });
}

chartGenerator(labels, data);

/*=================== TAB filters ================*/
let currentTab
function openCity(evt, tabName) {
    // Declare all variables
    var i, tabcontent, tablinks;

    // Get all elements with class="tabcontent" and hide them
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }

    // Get all elements with class="tablinks" and remove the class "active"
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }

    // Show the current tab, and add an "active" class to the button that opened the tab
    document.getElementById(tabName).style.display = "block";
    evt.currentTarget.className += " active";

    currentTab = tabName;
    //console.log(tabName);

}

let filterStatment = (catList) => {
    let outputFilter = ["any"];
    catList.forEach(function(catChar){
        outputFilter.push(['==', ['get', '大類'], catChar]);
        outputFilter.push(['==', ['get', '大類1'], catChar]);
        outputFilter.push(['==', ['get', '大類2'], catChar]);
        outputFilter.push(['==', ['get', '大類3'], catChar]);
    })
    return outputFilter;
}

$(function(){
    $("#example").multiselect({
        maxSelectionAllowed: 3
    });
});

let filtersCat
$("#example").on("selected.bs.multiselect",function(e, option){
    let selectedVal = option.$element[0].value 
    selectedCat.push(selectedVal[0]);

    filtersCat = filterStatment(selectedCat);

    let yearMin = parseInt(minSliderVal, 10);
    let yearMax = parseInt(maxSliderVal, 10);
    filterBy(yearMin, yearMax);
    //console.log(filtersCat);
    //featuresFromMoveend = map.queryRenderedFeatures({layers: ['station-access']});
    map.on('sourcedata', onSourceData);


});


$("#example").on("deselected.bs.multiselect",function(e, option){
    let removedVal = option.$element[0].value 
    for( var i = 0; i < selectedCat.length; i++){ 
        if ( selectedCat[i] === removedVal[0]) { selectedCat.splice(i, 1); }}//=> [1, 2, 3, 4, 6, 7, 8, 9, 0]


    if(selectedCat.length > 0){
        filtersCat = filterStatment(selectedCat);
        let yearMin = parseInt(minSliderVal, 10);
        let yearMax = parseInt(maxSliderVal, 10);
        filterBy(yearMin, yearMax);

        map.on('sourcedata', onSourceData);

    }

    if(selectedCat.length === 0){
        filtersCat = undefined;
        let yearMin = parseInt(minSliderVal, 10);
        let yearMax = parseInt(maxSliderVal, 10);
        filterBy(yearMin, yearMax);

        map.on('sourcedata', onSourceData);

    }
});