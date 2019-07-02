import EPICSArchAppDatasource from './datasource';
import { EPICSArchAppQueryCtrl } from './query_ctrl';
import { EPICSArchAppConfigCtrl } from './config_ctrl';

class EPICSArchAppAnnotationsQueryCtrl {
  static templateUrl = 'partials/annotations.editor.html';
}

export {
  EPICSArchAppDatasource as Datasource,
  EPICSArchAppQueryCtrl as QueryCtrl,
  EPICSArchAppConfigCtrl as ConfigCtrl,
  EPICSArchAppAnnotationsQueryCtrl as AnnotationsQueryCtrl,
};
