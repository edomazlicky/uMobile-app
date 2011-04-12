var MapService = function (facade) {
    var app = facade,
        self = {},
        mapPoints = [];
    
    self.requestErrors = {
        NETWORK_UNAVAILABLE: 0,
        REQUEST_TIMEOUT: 1,
        SERVER_ERROR: 2,
        NO_DATA_RETURNED: 3,
        INVALID_DATA_RETURNED: 4,
        GENERAL_ERROR: 5
    };
    
    self.init = function () {               
        self.loadMapPoints();
    };
    
    self.search = function (query, opts) {

        var result = [], db, queryResult;
        db = Titanium.Database.open('umobile');
        query = query.toLowerCase();

        //If a search isn't already executing
       if(query != '' && typeof query == 'string') {
            onSearch(query);
            Ti.API.info("Starting to search...");
            
            //Query the database for rows in the map_locations table that match the query
            queryResult = db.execute('SELECT * FROM map_locations WHERE title LIKE "%'+ query +'%" OR searchText LIKE "%'+ query +'%" or abbreviation LIKE "%'+ query +'%"');
            
            //Iterate through the query result to add objects to the result array
            while (queryResult.isValidRow()) {
                result.push({
                    title: queryResult.fieldByName('title'),
                    address: queryResult.fieldByName('address'),
                    latitude: queryResult.fieldByName('latitude'),
                    longitude: queryResult.fieldByName('longitude'),
                    img: queryResult.fieldByName('img')
                });
                Ti.API.info(queryResult.fieldByName('img'));
                queryResult.next();
            }
            
            queryResult.close();
            onSearchComplete(result);
            
        } else if (query === '') {
            onEmptySearch();
        }
        db.close();
    };
    self.getAnnotationByTitle = function(t) {
        for (var i=0, iLength=mapPoints.length; i<iLength; i++) {
            if (mapPoints[i].title === t) {
                return mapPoints[i];
            }
        }
        return false;
    };
    self.loadMapPoints = function (filters) {
        //Default returns all points for an institution.
        //Can be filtered by campus, admin-defined categories
        Ti.API.info("loadMapPoints()");

        request = Titanium.Network.createHTTPClient ({
            connectionType : 'GET',
            location : app.UPM.MAP_SERVICE_URL,
            onload : self.newPointsLoaded,
            onerror : onLoadError
        });
        request.open("GET", app.UPM.MAP_SERVICE_URL);
        request.send();

        Ti.API.debug("MapService.updateMapPoints() request sent");

    };
    self.newPointsLoaded = function (e) {
        // Customize the response and add it to the cached mapPoints array in the MapService object.
        var response, responseLength, db;
        
        try {
            response = JSON.parse(e.source.responseText);
            responseLength = response.buildings.length;
            if (responseLength > 0) {
                db = Ti.Database.open('umobile');
                
                for (var i = 0; i < responseLength; i++) {
                    var building = response.buildings[i];
                    if (building.name && building.latitude && building.longitude) {
                        response.buildings[i].title = response.buildings[i].name;
                        response.buildings[i].latitude = parseFloat(response.buildings[i].latitude);
                        response.buildings[i].longitude = parseFloat(response.buildings[i].longitude);
                        
                        db.execute("REPLACE INTO map_locations (title, abbreviation, accuracy, address, alternateName, latitude, longitude, searchText, zip, img) VALUES (" + 
                            JSON.stringify(building.name) + ", " + 
                            JSON.stringify(building.abbreviation) + ", " + 
                            JSON.stringify(building.accuracy) + ", " + 
                            JSON.stringify(building.address) + ", " + 
                            JSON.stringify(building.alternateName) + ", " + 
                            parseFloat(building.latitude) + ", " + 
                            parseFloat(building.longitude) + ", " + 
                            JSON.stringify(building.searchText) + ", " + 
                            (building.zip ? parseInt(building.zip, 10) : null) + ", " + 
                            JSON.stringify(building.img) +")");
                        
                        
                        mapPoints.push(response.buildings[i]);
                    }
                    else {
                        Ti.API.debug("Skipping " + building.name);
                    }
                }
                db.close();
                onPointsLoaded();                
            }
            else {
                //No location objects in the response, so fire an event so the controller is aware.
                Ti.App.fireEvent('MapProxyLoadError', {errorCode: self.requestErrors.NO_DATA_RETURNED});
            }
        }
        catch (e) {
            Ti.API.info("Data was invalid, calling onInvalidData()");
            //Data didn't parse, so fire an event so the controller is aware
            Ti.App.fireEvent('MapProxyLoadError', {errorCode: self.requestErrors.INVALID_DATA_RETURNED});
        }
    };
    
    function onLoadError (e) {
        var errorCode;
        Ti.API.debug("Error with map service" + JSON.stringify(e));
        Ti.App.fireEvent('MapProxyLoadError', {errorCode: self.requestErrors.GENERAL_ERROR});
    }
    
    function onSearch(query) {
        Ti.App.fireEvent('MapProxySearching',query);
    }
    
    function onEmptySearch () {
        Ti.App.fireEvent('MapProxyEmptySearch');
    }
    
    function onSearchComplete(result) {
        Ti.API.debug('onSearchComplete in MapProxy');
        if (result.length < 1) {
            alert(app.localDictionary.mapNoSearchResults);
        }
        else {
            Ti.App.fireEvent('MapProxySearchComplete', { points: result });
        }
    }
    
    function onPointsLoaded () {
        Ti.App.fireEvent('MapProxyPointsLoaded');
    }
    
    return self;
};