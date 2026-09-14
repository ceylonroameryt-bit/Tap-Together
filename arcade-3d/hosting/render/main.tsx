import {createRoot} from 'react-dom/client';
import Home from '../../app/page';
import '../../app/globals.css';
createRoot(document.getElementById('root')!).render(<><Home/><p style={{textAlign:'center',padding:16,fontSize:13}}>Free hosting: rooms reset after server restarts. Create a fresh room to reconnect.</p></>);
