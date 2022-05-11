export const InfoWindowMixin = {
  props: {
    attributes: Object,
  },
  methods: {
    dispatch(type, data) {
      this.$emit('dispatch', type, data);
    }
  }
}