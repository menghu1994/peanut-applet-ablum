import request from "@/nxTemp/request/ajax.js";

const basicUrl = "api/v1/";

const PhotoService = {
    query: (data) => {
        return api.request({
            url: basicUrl + '/photos',
            method: "GET",
            data
        })
    }
}

export default PhotoService
