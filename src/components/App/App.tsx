import { useState } from "react";
import { useForm } from "react-hook-form";

const App = () => {
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const [subStacks, setSubStacks] = useState(null);

  const onSubmit = async ({url}) => {
    try {
      setLoading(true);
      
      const html = await fetch(`https://cors-proxy-wine.vercel.app/api?url=${url}`).then(res => res.text());

      const matches = html.match(/ytInitialPlayerResponse\s*=\s*({.+?})\s*;\s*(?:var\s+meta|<\/script|\n)/);

      if(!matches || !matches[0]) {
        throw new Error('ytInitialPlayerResponse not found');
      }

      const playerResponse = JSON.parse(matches[1]);

      setSubStacks([{
        title: playerResponse.videoDetails.title
      }]);

      const streamingData = playerResponse.streamingData;

      const regularFormats = streamingData['formats'];
	    const adaptiveFormats = streamingData['adaptiveFormats'];
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
        
        {errors.url && <p className="red">This field is required</p>}
        
        <input type="submit" value={"Get"} />
      </form>

      <div className="sub-track">
        {subStacks && subStacks.map((subStack, key) => {
          const {title} = subStack;

          return <p key={key}>{title}</p>
        })}
      </div>
    </div>
  </>
};

export default App;
