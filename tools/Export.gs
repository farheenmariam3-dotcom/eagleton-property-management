/**
 * EXPORT YOUR DATA FROM THE GOOGLE VERSION
 * Put this in your existing Apps Script project as a NEW file called "Export" (do not edit Code.gs),
 * choose the function  exportEagletonData  and press Run. It saves "eagleton-export.json" in your Google Drive.
 * It only READS your sheet - nothing in your live app is changed.
 */
function exportEagletonData() {
  var tz = Session.getScriptTimeZone();
  var props = PropertiesService.getScriptProperties().getProperties();
  var ss = props.SSID ? SpreadsheetApp.openById(props.SSID) : SpreadsheetApp.getActiveSpreadsheet();
  var out = { sheets: {}, props: props };
  ss.getSheets().forEach(function (sh) {
    var v = sh.getDataRange().getValues();
    out.sheets[sh.getName()] = v.map(function (row) {
      return row.map(function (x) {
        if (x === null || x === undefined) return '';
        if (x instanceof Date) return Utilities.formatDate(x, tz, 'yyyy-MM-dd');
        return String(x);
      });
    });
  });
  var f = DriveApp.createFile('eagleton-export.json', JSON.stringify(out), MimeType.PLAIN_TEXT);
  Logger.log('Saved to your Google Drive: ' + f.getUrl());
}
