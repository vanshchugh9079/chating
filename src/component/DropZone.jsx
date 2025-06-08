import { useDropzone } from 'react-dropzone';
import { useCallback, useState } from 'react';
import { UploadCloud } from 'lucide-react';

const Dropzone = ({setAvatar}) => {
    const [files, setFiles] = useState([]);
    const onDrop = useCallback((acceptedFiles) => {
        console.log(acceptedFiles[0]);
        setAvatar(acceptedFiles)
        setFiles(acceptedFiles.map(file => Object.assign(file, {
            preview: URL.createObjectURL(file)
        })));
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: 'image/' });

    return (
        <div {...getRootProps()} className="p-0 d-flex flex-column justify-content-center align-items-center " style={{
            border: "2px solid white",
        }}>
            {
                files.length == 0 &&
                <>
                    <input {...getInputProps()} className='p-0' />
                    <UploadCloud className=" p-0" size={40} />
                    {isDragActive ? (
                        <p className=" p-0">Drop the files here...</p>
                    ) : (
                        <p className=" p-0">Add a Avatar</p>
                    )}
                </>
            }
            <div className=" flex flex-wrap p-0 justify-content-center w-100">
                {files.map(file => (
                    <div key={file.name} className="h-25 w-25 rounded-lg ms-auto me-auto border">
                        <img src={file.preview} alt={file.name} className="w-100 h-100  object-cover" />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Dropzone;
