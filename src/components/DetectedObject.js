import React from 'react';

class DetectedObject extends React.Component{
    constructor(props){
        super(props);
        this.state = {
            bbox: [0, 0, 0, 0], // x, y, width, height
            className: '',
            score: 0.0
        };
    }
    render(){
        return(
            <>
            <p>BoundingBox: {this.state.bbox} </p>
            <p>ClassName: {this.state.className}</p>
            <p>Score: {this.state.score} </p>
            </>
        );
    }
};

export default DetectedObject;