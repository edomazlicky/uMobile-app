// Ti.include('config.js');

var GenericTitleBar = function (opts) {
    //Required: app, opts.windowKey
    //Optional attributes include top, left, height, title, homeButton (bool), backButton (View), settingsButton (bool)
    var app = opts.app, title, backButton, homeButtonContainer, homeButton, settingsButtonContainer, settingsButton, 
        titleBar = Titanium.UI.createView(app.styles.titleBar),
        labelStyle = app.styles.titleBarLabel,
        onSettingsClick, onSettingsPressDown, onSettingsPressUp, onHomeClick, onHomePressUp, onHomePressDown;
        
    function init() {
        if (opts.title) {
            //Places the title in the center of the titlebar...
            labelStyle.text = opts.title;
            title = Titanium.UI.createLabel(labelStyle);
            titleBar.add(title);
        }
        titleBar.updateTitle = function (t) {
            title.text = t;
        };
        if (opts.backButton) {
            //This adds a button at the left of the title bar, presumably to go back to a previous view. Not limited to that, as there are no event listeners added here.
            //Expects a view object.
            //There should only be either a home button or backbutton, not both.
            backButton = opts.backButton;
            titleBar.add(backButton);
        }
        if (opts.homeButton && !opts.backButton) {
            //Expects homeButton to be a boolean indicating whether or not to show the home button
            //There shouldn't be a home button and back button, as then the bar just gets too cluttered. Back button wins in a fight.
            homeButtonContainer = Titanium.UI.createView(app.styles.titleBarHomeContainer);
            titleBar.add(homeButtonContainer);
            
            homeButton = Titanium.UI.createImageView(app.styles.titleBarHomeButton);
            homeButtonContainer.add(homeButton);

            homeButtonContainer.addEventListener('singletap', onHomeClick);
            homeButtonContainer.addEventListener('touchstart', onHomePressDown);
            homeButtonContainer.addEventListener(Ti.Platform.osname === 'android' ? 'touchcancel' : 'touchend', onHomePressUp);
            
        }
        if (opts.settingsButton) {
            settingsButtonContainer = Titanium.UI.createView(app.styles.titleBarSettingsContainer);
            titleBar.add(settingsButtonContainer);
            
            //Expects settingsButton to be a boolean indicating whether or not to show the settings icon
            settingsButton = Titanium.UI.createImageView(app.styles.titleBarSettingsButton);
        	settingsButtonContainer.add(settingsButton);

            settingsButtonContainer.addEventListener('singletap', onSettingsClick);
            settingsButtonContainer.addEventListener('touchstart', onSettingsPressDown);
            settingsButtonContainer.addEventListener(Ti.Platform.osname === 'android' ? 'touchcancel' : 'touchend', onSettingsPressUp);
        }
    }
    onHomeClick = function (e) {
        Ti.API.debug("Home button clicked in GenericTitleBar");
        app.models.windowManager.openWindow(app.controllers.portalWindowController.key);
    };
    
    onHomePressDown = function (e) {
        var timeUp;
        
        homeButtonContainer.backgroundColor = app.styles.titleBarHomeContainer.backgroundColorPressed;
        if (Ti.Platform.osname === 'android') {
            //Because Android doesn't consistently register touchcancel or touchend, especially
            //when the window changes in the middle of a press
            timeUp = setTimeout(function(){
                homeButtonContainer.backgroundColor = app.styles.titleBarHomeContainer.backgroundColor;
                clearTimeout(timeUp);
            }, 1000);
        }
    };
    
    onHomePressUp = function (e) {
        homeButtonContainer.backgroundColor = app.styles.titleBarHomeContainer.backgroundColor;
    };
    onSettingsClick = function (e) {
        app.models.windowManager.openWindow(app.controllers.settingsWindowController.key);
    };
    
    onSettingsPressDown = function (e) {
        var timeUp;
        settingsButtonContainer.backgroundColor = app.styles.titleBarSettingsContainer.backgroundColorPressed;
        if (Ti.Platform.osname === 'android') {
            //Because Android doesn't consistently register touchcancel or touchend, especially
            //when the window changes in the middle of a press
            timeUp = setTimeout(function(){
                settingsButtonContainer.backgroundColor = app.styles.titleBarHomeContainer.backgroundColor;
                clearTimeout(timeUp);
            }, 1000);            
        }
    };
    
    onSettingsPressUp = function (e) {
        settingsButtonContainer.backgroundColor = app.styles.titleBarSettingsContainer.backgroundColor;
    };

    init();

    return titleBar;
};