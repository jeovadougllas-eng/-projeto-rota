package app.traxio.mobile;

import java.io.*;
import java.net.URI;
import java.security.MessageDigest;
import java.util.*;
import java.util.zip.*;

/** Pure Java installer, shared by Android and the JVM integrity tests. */
final class UpdateBundle {
 static final long MAX_BYTES=80L*1024*1024;
 static final int MAX_FILES=512;
 static final String ORIGIN="https://traxio-preview.vercel.app";
 static String safeDownload(String path) throws IOException {
  if(path==null||!path.matches("/updates/android/bundles/[a-f0-9]{64}\\.zip"))throw new IOException("Invalid release path");
  URI uri=URI.create(ORIGIN+path);
  if(!"https".equals(uri.getScheme())||!"traxio-preview.vercel.app".equals(uri.getHost())||uri.getUserInfo()!=null)throw new IOException("Untrusted release origin");
  return uri.toString();
 }
 static void safeVersion(String version) throws IOException {if(version==null||!version.matches("[a-f0-9]{64}"))throw new IOException("Invalid release version");}
 static File destination(File root,String name) throws IOException {
  if(name==null||name.isEmpty()||name.contains("\\")||name.startsWith("/")||name.contains(":")||name.contains("\u0000"))throw new IOException("Invalid entry");
  if(!name.equals("index.html")&&!name.equals("traxelo-release.json")&&!name.startsWith("assets/"))throw new IOException("Non-web entry");
  for(String part:name.split("/"))if(part.equals("..")||part.equals(".")||part.isEmpty())throw new IOException("Invalid path segment");
  if(!name.matches(".*\\.(html|js|css|json|svg|png|webp|jpe?g|ttf|woff2?|txt|md)$"))throw new IOException("Unsupported web file");
  File result=new File(root,name);if(!result.getCanonicalPath().startsWith(root.getCanonicalPath()+File.separator))throw new IOException("Entry outside release");
  return result;
 }
 static String hash(File file) throws Exception {
  MessageDigest digest=MessageDigest.getInstance("SHA-256");try(InputStream in=new FileInputStream(file)){byte[] b=new byte[32768];int n;while((n=in.read(b))!=-1)digest.update(b,0,n);}
  StringBuilder out=new StringBuilder();for(byte b:digest.digest())out.append(String.format(Locale.ROOT,"%02x",b&255));return out.toString();
 }
 static void verify(File root,Map<String,String> files) throws Exception {
  if(files.size()>MAX_FILES||!files.containsKey("index.html")||!files.containsKey("assets/capacitor-runtime.js"))throw new IOException("Incomplete release");
  for(Map.Entry<String,String> entry:files.entrySet()){
   File file=destination(root,entry.getKey());if(!file.isFile()||!hash(file).equals(entry.getValue()))throw new IOException("Release file mismatch");
  }
 }
 static void extract(File zip,File target,Map<String,String> files) throws Exception {
  Set<String> found=new HashSet<>();long expanded=0;
  try(ZipInputStream in=new ZipInputStream(new FileInputStream(zip))){ZipEntry entry;byte[] buffer=new byte[32768];
   while((entry=in.getNextEntry())!=null){
    if(entry.isDirectory())continue;
    String name=entry.getName();File file=destination(target,name);
    if(!name.equals("traxelo-release.json")&&!files.containsKey(name))throw new IOException("Undeclared file");
    if(!found.add(name)||found.size()>MAX_FILES+1)throw new IOException("Repeated or excessive entries");
    file.getParentFile().mkdirs();try(OutputStream out=new FileOutputStream(file)){int n;while((n=in.read(buffer))!=-1){expanded+=n;if(expanded>MAX_BYTES)throw new IOException("Oversized release");out.write(buffer,0,n);}}
   }
  }
  verify(target,files);
 }
 static void remove(File file){if(file.isDirectory()){File[] entries=file.listFiles();if(entries!=null)for(File child:entries)remove(child);}file.delete();}
}
