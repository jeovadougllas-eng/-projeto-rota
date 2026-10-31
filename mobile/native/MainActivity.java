package app.traxio.mobile;

import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.ServerPath;
import java.io.File;

public class MainActivity extends BridgeActivity {
 private static boolean started=false;
 @Override public void onCreate(Bundle state){
  // Activity recreation (rotation) must not count as a failed trial or apply a download mid-route.
  if(!started){File release=TraxeloUpdatesPlugin.startup(this);if(release!=null)bridgeBuilder.setServerPath(new ServerPath(ServerPath.PathType.BASE_PATH,release.getAbsolutePath()));started=true;}
  else{String active=TraxeloUpdatesPlugin.prefs(this).getString("active","");File release=TraxeloUpdatesPlugin.checked(this,active);if(release!=null)bridgeBuilder.setServerPath(new ServerPath(ServerPath.PathType.BASE_PATH,release.getAbsolutePath()));}
  registerPlugin(TraxeloUpdatesPlugin.class);super.onCreate(state);
  String boot=TraxeloUpdatesPlugin.prefs(this).getString("boot","");
  if(!boot.isEmpty())new Handler(Looper.getMainLooper()).postDelayed(()->{if(getBridge()!=null)TraxeloUpdatesPlugin.rollback(this,getBridge(),boot);},45000);
 }
}
