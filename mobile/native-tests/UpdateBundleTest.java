package app.traxio.mobile;
import org.junit.Test;
import static org.junit.Assert.*;
import java.io.*;
import java.nio.file.*;
import java.util.*;
import java.util.zip.*;

public class UpdateBundleTest {
 interface Checked {void run() throws Exception;}
 static void rejects(Checked action) throws Exception {try{action.run();fail("Unsafe update accepted");}catch(IOException expected){}}
 @Test public void pinnedOriginAndContentAddressedPaths() throws Exception {
  String v="a".repeat(64);assertEquals(UpdateBundle.ORIGIN+"/updates/android/bundles/"+v+".zip",UpdateBundle.safeDownload("/updates/android/bundles/"+v+".zip"));
  for(String p:List.of("https://evil.test/update.zip","//evil.test/update.zip","/updates/android/bundles/../release.zip","/updates/android/bundles/test.zip"))rejects(()->UpdateBundle.safeDownload(p));
 }
 @Test public void pathTraversalAndNativeExecutablesRejected() throws Exception {
  File root=Files.createTempDirectory("release-policy").toFile();
  for(String p:List.of("../index.html","assets/../../index.html","/tmp/index.html","assets/../index.html","assets/native.dex","assets/native.so","assets/x\\x.js","assets//x.js","secret.txt"))rejects(()->UpdateBundle.destination(root,p));
  assertEquals(new File(root,"assets/app.js"),UpdateBundle.destination(root,"assets/app.js"));
 }
 static Map<String,String> source(File root) throws Exception {
  Map<String,String> files=new TreeMap<>();for(String p:List.of("index.html","assets/capacitor-runtime.js")){File f=UpdateBundle.destination(root,p);f.getParentFile().mkdirs();Files.write(f.toPath(),("valid "+p).getBytes(java.nio.charset.StandardCharsets.UTF_8));files.put(p,UpdateBundle.hash(f));}return files;
 }
 @Test public void corruptedAndIncompleteFilesRejected() throws Exception {
  File root=Files.createTempDirectory("release-hash").toFile();Map<String,String> files=source(root);UpdateBundle.verify(root,files);
  Files.write(new File(root,"index.html").toPath(),"corrupted".getBytes(java.nio.charset.StandardCharsets.UTF_8));rejects(()->UpdateBundle.verify(root,files));
  rejects(()->UpdateBundle.verify(root,Map.of("index.html","a".repeat(64))));
 }
 @Test public void validArchiveIsVerifiedAndUndeclaredEntriesRejected() throws Exception {
  File root=Files.createTempDirectory("release-zip").toFile();Map<String,String> files=source(root);File zip=new File(root,"release.zip");
  try(ZipOutputStream out=new ZipOutputStream(new FileOutputStream(zip))){for(String p:files.keySet()){out.putNextEntry(new ZipEntry(p));out.write(Files.readAllBytes(new File(root,p).toPath()));out.closeEntry();}}
  File target=new File(root,"target");target.mkdirs();UpdateBundle.extract(zip,target,files);UpdateBundle.verify(target,files);
  try(ZipOutputStream out=new ZipOutputStream(new FileOutputStream(zip))){out.putNextEntry(new ZipEntry("assets/undeclared.js"));out.write(1);out.closeEntry();}
  rejects(()->UpdateBundle.extract(zip,new File(root,"bad"),files));
 }
}
