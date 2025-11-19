
import { Component, OnInit, AfterViewInit } from '@angular/core';



/**
 * #How the splash works.
 * 
 * The splashscreen has two parts; the lesser splashscreen and the angular splashscreen. 
 * The lesser splashscreen is raw css and html included in index.html so that the splashscreen is desplayed before 
 * angular boots up.
 * 
 * once angular boots up, this component is deplayed over the identical looking lesser splashscreen. This component
 * then deletes the lesser splashscreen. This angular splashscreen is animated and attempts to appear everytime one opens
 * the app. It uses both the visibility api and the focus/blur events because that appeared to work the best.
 * 
 * Despite being an angular splashscreen, this does not use angular animations because angular animations didn't seem to 
 * offer any features which would help here. Plus I find angular animations difficult to use compared to CSS transitions
 * 
 * This client uses lots of raw non-angular javascript. This is partly because it was written quickly to please the client
 * and partly because it interacts with the lesser splashscreen anyway which I believe would be difficult with angular javascript  
*/
@Component({
  selector: 'wbapp-splash-screen',
  template: `
      <div class="wbapp-splash-screen"  [class.gone] = "!show">  
         <div id="splashscreen"></div>
      </div>
  `,
  animations: [

  ],
  styles: [`
      .wbapp-splash-screen {
          position: absolute;
          top: 0;
          right: 0;
          bottom: 0;
          left: 0;
          z-index: 9999;
      }

      .gone {
        transition: bottom 500ms linear 2s;
        bottom: 100%;
      }

      #splashscreen {
        box-shadow: black 0px 0px 10px;
      }

      /* # splashscreen must be kept in sync with the index.html CSS splash; so when we replace the simple splash with this one,
          nothing will be 
      */

     #splashscreen {
        background-size: cover; 
        background-repeat:no-repeat;
        background-color: #343e19;
        height: 100%; 
        width: 100%;
      }

      @media (max-width: 591px) {
        #splashscreen {
          background: url('./assets/WB_SPLASHSCREEN.jpg'); 
          background-position: 100% 0%; 
        }
      } 

      
      @media (min-width: 590px) {
        #splashscreen {
          background: url('./assets/WB_Splashcreen_Landscape.jpg'); 
          background-position: top; 
        }
      }   
  `]
})
export class SplashScreenComponent implements OnInit, AfterViewInit {
  show = true;

  constructor() {}
  
  ngAfterViewInit() {
    setTimeout(() => {
      this.show = false;
      //remove the non-angular slashscreen which is included to cover up angular as it starts up
      if (document.getElementById("lesserSplashscreen")) {
        document.getElementById("lesserSplashscreen").remove(); 
      }
    }, 0);
  }

  ngOnInit() {
    document.addEventListener("visibilitychange", (e) => {
      //console.log("visibilityChange", document.hidden, e);
      //add the back in
      if (document.hidden) {
        this.show = true;
      } else {
        this.show = false;
      }
    }, false);

    
    document.addEventListener("focus", (e) => {
      this.show = false;
    }, false);

    document.addEventListener("blur", (e) => {
      this.show = true;
    }, false);
  }


}

