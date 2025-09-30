import { StyloEditor } from "../../src/index.ts";
//import "../../src/styles.scss";
import "../../src/index.css";


StyloEditor.init({
  container: document.body,
  panelOptions: {
    minimized: true,
    position: { x: 220, y: 20 }
  },
  excludeSelectors: ['.controls', '.controls *']
});