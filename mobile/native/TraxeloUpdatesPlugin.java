package app.traxio.mobile;

import android.content.Context;
import android.content.SharedPreferences;
import com.getcapacitor.*;
import com.getcapacitor.annotation.CapacitorPlugin;
import org.json.*;
import javax.net.ssl.HttpsURLConnection;
import java.io.*;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.concurrent.Executors;

@CapacitorPlugin(name="TraxeloUpdates")
public class TraxeloUpdatesPlugin extends Plugin {
 private static final java.util.concurrent.ExecutorService WORKER=Executors.newSingleThreadExecutor();
 static final String PREFS="traxelo_web_releases_v1",RUNTIME="capacitor8-20261026";
 static SharedPreferences prefs(Context c){return c.getSharedPreferences(PREFS,Context.MODE_PRIVATE);}
 static File root(Context c){return new File(c.getFilesDir(),"traxelo-web-releases");}
 static byte[] read(InputStream in,int limit) throws IOException {ByteArrayOutputStream out=new ByteArrayOutputStream();byte[] buffer=new byte[8192];int n;while((n=in.read(buffer))!=-1){if(out.size()+n>limit)throw new IOException("Oversized metadata");out.write(buffer,0,n);}return out.toByteArray();}
 static JSONObject json(File file) throws Exception {try(InputStream in=new FileInputStream(file)){return new JSONObject(new String(read(in,256*1024),StandardCharsets.UTF_8));}}
 static Map<String,String> files(JSONObject release) throws Exception {
  JSONObject object=release.getJSONObject("files");Map<String,String> files=new TreeMap<>();Iterator<String> keys=object.keys();
  while(keys.hasNext()){String key=keys.next(),value=object.getString(key);UpdateBundle.safeVersion(value);files.put(key,value);}return files;
 }
 static File checked(Context c,String version){
  try{UpdateBundle.safeVersion(version);File dir=new File(root(c),version);JSONObject release=json(new File(dir,"traxelo-release.json"));
   if(!version.equals(release.getString("version"))||!RUNTIME.equals(release.getString("runtime"))||release.getInt("nativeVersion")!=2)return null;
   UpdateBundle.verify(dir,files(release));return dir;
  }catch(Exception error){return null;}
 }
 static String bundled(Context c){try(InputStream in=c.getAssets().open("public/traxelo-release.json")){return new JSONObject(new String(read(in,256*1024),StandardCharsets.UTF_8)).getString("version");}catch(Exception error){return "bundled";}}
 /** Called only when creating a fresh Activity, before the WebView loads. Never reload an active route. */
 static File startup(Context c){
  SharedPreferences p=prefs(c);
  if(p.getInt("native",0)!=2){p.edit().clear().putInt("native",2).commit();return null;}
  String boot=p.getString("boot",""),active=p.getString("active",""),previous=p.getString("previous",""),pending=p.getString("pending","");
  if(!boot.isEmpty()){p.edit().putString("failed",boot).putString("active",previous).remove("pending").remove("boot").commit();active=previous;pending="";}
  if(!pending.isEmpty()&&!pending.equals(p.getString("failed",""))){
   File candidate=checked(c,pending);
   if(candidate!=null){p.edit().putString("previous",active).putString("active",pending).putString("boot",pending).remove("pending").commit();return candidate;}
   p.edit().remove("pending").putString("failed",pending).commit();
  }
  if(!active.isEmpty()){
   File candidate=checked(c,active);if(candidate!=null)return candidate;
   File fallback=checked(c,previous);p.edit().putString("failed",active).putString("active",fallback==null?"":previous).remove("boot").commit();return fallback;
  }
  return null;
 }
 static void rollback(Context c,Bridge bridge,String boot){
  SharedPreferences p=prefs(c);if(!boot.equals(p.getString("boot","")))return;
  String previous=p.getString("previous","");File fallback=checked(c,previous);
  p.edit().putString("failed",boot).putString("active",fallback==null?"":previous).remove("boot").commit();
  if(fallback==null)bridge.setServerAssetPath("public");else bridge.setServerBasePath(fallback.getAbsolutePath());
 }
 @PluginMethod public void ready(PluginCall call){
  SharedPreferences p=prefs(getContext());String boot=p.getString("boot","");
  if(!boot.isEmpty()&&!boot.equals(call.getString("version"))){call.reject("Unexpected running release");return;}
  p.edit().remove("boot").commit();
  Set<String> keep=new HashSet<>(Arrays.asList(p.getString("active",""),p.getString("previous",""),p.getString("pending","")));
  File[] old=root(getContext()).listFiles();if(old!=null)for(File file:old)if(file.isDirectory()&&!keep.contains(file.getName()))UpdateBundle.remove(file);
  call.resolve();
 }
 @PluginMethod public void status(PluginCall call){
  SharedPreferences p=prefs(getContext());JSObject result=new JSObject();result.put("active",p.getString("active",bundled(getContext())));result.put("pending",p.getString("pending",""));result.put("failed",p.getString("failed",""));result.put("runtime",RUNTIME);call.resolve(result);
 }
 private static HttpsURLConnection connect(String target) throws Exception {
  HttpsURLConnection connection=(HttpsURLConnection)new URL(target).openConnection();connection.setInstanceFollowRedirects(false);connection.setConnectTimeout(15000);connection.setReadTimeout(30000);connection.setRequestProperty("Cache-Control","no-cache");
  if(connection.getResponseCode()!=200){connection.disconnect();throw new IOException("Update server unavailable");}return connection;
 }
 @PluginMethod public void check(PluginCall call){
  WORKER.execute(()->{
   File archive=null,staging=null;
   try{
    boolean qa=(getContext().getApplicationInfo().flags&android.content.pm.ApplicationInfo.FLAG_DEBUGGABLE)!=0&&prefs(getContext()).getBoolean("qa",false);
    HttpsURLConnection response=connect(UpdateBundle.ORIGIN+(qa?"/updates/android/candidate.json":"/updates/android/manifest.json"));byte[] raw;
    try(InputStream in=response.getInputStream()){raw=read(in,256*1024);}finally{response.disconnect();}
    if(raw.length>256*1024)throw new IOException("Oversized manifest");JSONObject release=new JSONObject(new String(raw,StandardCharsets.UTF_8));
    if(release.getInt("schema")!=1||!"app.traxio.mobile".equals(release.getString("packageId")))throw new IOException("Invalid release identity");
    JSObject result=new JSObject();
    if(release.getInt("nativeVersion")!=2||!RUNTIME.equals(release.getString("runtime"))){result.put("nativeRequired",true);call.resolve(result);return;}
    String version=release.getString("version");UpdateBundle.safeVersion(version);
    SharedPreferences p=prefs(getContext());String active=p.getString("active","");
    if(version.equals(active)||version.equals(bundled(getContext()))||version.equals(p.getString("failed",""))){result.put("current",true);call.resolve(result);return;}
    if(version.equals(p.getString("pending",""))&&checked(getContext(),version)!=null){result.put("pending",true);call.resolve(result);return;}
    String url=UpdateBundle.safeDownload(release.getString("bundle"));long expected=release.getLong("bytes");
    if(expected<=0||expected>UpdateBundle.MAX_BYTES)throw new IOException("Invalid archive size");
    Map<String,String> fileHashes=files(release);if(fileHashes.size()>UpdateBundle.MAX_FILES)throw new IOException("Too many files");
    root(getContext()).mkdirs();archive=File.createTempFile("release-",".zip",root(getContext()));response=connect(url);long bytes=0;
    try(InputStream in=response.getInputStream();OutputStream out=new FileOutputStream(archive)){byte[] buffer=new byte[32768];int n;while((n=in.read(buffer))!=-1){bytes+=n;if(bytes>expected||bytes>UpdateBundle.MAX_BYTES)throw new IOException("Oversized download");out.write(buffer,0,n);}}finally{response.disconnect();}
    if(bytes!=expected||!UpdateBundle.hash(archive).equals(release.getString("sha256")))throw new IOException("Archive integrity mismatch");
    staging=new File(root(getContext()),version+"-staging");UpdateBundle.remove(staging);staging.mkdirs();UpdateBundle.extract(archive,staging,fileHashes);
    // Save the trusted HTTPS manifest, not untrusted archive metadata.
    try(OutputStream out=new FileOutputStream(new File(staging,"traxelo-release.json"))){out.write(release.toString().getBytes(StandardCharsets.UTF_8));}
    File target=new File(root(getContext()),version);UpdateBundle.remove(target);if(!staging.renameTo(target))throw new IOException("Could not atomically stage release");
    p.edit().putString("pending",version).commit();result.put("pending",true);result.put("version",version);call.resolve(result);
   }catch(Exception error){call.reject("Could not safely stage update: "+error.getMessage());}
   finally{if(archive!=null)archive.delete();if(staging!=null&&staging.exists())UpdateBundle.remove(staging);}
  });
 }
}
