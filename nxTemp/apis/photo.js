const basicUrl = "api/v1/";

const PhotoService = {
    query: (params) => {
        return this.$t.http.get(basicUrl + '/photos', {
            params
        })
    }
}

export default PhotoService
