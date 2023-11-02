import { useState } from "react";
import { useForm } from "react-hook-form";
import { getPlayerJSUrl, processPlayerJs } from "../../helpers/decipher";

const App = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState(null);
  const [formats, setFormats] = useState(null);

  const onSubmit = async ({url}) => {
    try {
      setLoading(true);
      
      const html = await fetch(`https://cors-proxy-wine.vercel.app/api?url=${url}`).then(res => res.text());

      const matches = html.match(/ytInitialPlayerResponse\s*=\s*({.+?})\s*;\s*(?:var\s+meta|<\/script|\n)/);

      if(!matches || !matches[0]) {
        throw new Error('ytInitialPlayerResponse not found');
      }

      const playerResponse = JSON.parse(matches[1]);

      setTitle(playerResponse.videoDetails.title);

      const streamingData = playerResponse.streamingData;

      const regularFormats: [] = streamingData['formats'] || [];
	    const adaptiveFormats: [] = streamingData['adaptiveFormats'] || [];
      const formats = [...regularFormats, ...adaptiveFormats];

      const playerJsUrl = await getPlayerJSUrl(html);

      playerJsUrl && await processPlayerJs(playerJsUrl, formats);

      setFormats(formats);
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false);
    }
  };

  return <>
    <div className={`ytd-download ${loading ? 'loading' : ''}`}>
      <h1>Download Youtube mp3</h1>

      <form onSubmit={handleSubmit(onSubmit)}>
        <input placeholder="https://www.youtube.com/watch?v=bXlxny6w14A" {...register("url", { required: true })} />
        
        <button type="submit" value={"Get"} >Search</button>
      </form>
        
      {errors.url && <p className="red">This field is required</p>}

      <div className="sub-track">
        <p>{title}</p>
      </div>

      {
        formats && (
          <table className="list-download">
            <thead>
              <th>Download URL</th>
              <th>quality</th>
              <th>qualityLabel</th>
              <th>mimeType</th>
              <th>contentLength</th>
              <th>bitrate</th>
              <th>audioQuality</th>
            </thead>
            <tbody>
              {formats.map((format) => {
                console.log(format);
    
                return <tr>
                  <td><a target="_blank" download={title} title={title} href={format['url']}>Download</a></td>
                  <td>{format['quality']}</td>
                  <td>{format['qualityLabel']}</td>
                  <td>{format['mimeType']}</td>
                  <td>{((format['contentLength'] || 0) / 1024 / 1024).toFixed(2)}MB</td>
                  <td>{format['bitrate']}</td>
                  <td>{format['audioQuality']}</td>
                </tr>
              })}
            </tbody>
          </table>
        )
      }
    </div>
  </>
};

export default App;
