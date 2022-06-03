import * as React from 'react';
import * as ReactDOM from 'react-dom';

import StatusApp from './components/StatusApp';

function render() {
    ReactDOM.render(<StatusApp />, document.getElementById('status-app'));
}
render();
